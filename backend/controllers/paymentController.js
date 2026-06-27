const crypto = require('crypto');
const Ride = require('../models/Ride');
const Transaction = require('../models/Transaction');
const User = require('../models/User');
const { sendInvoiceEmail } = require('../utils/emailService');
const { verifyPaymentSchema } = require('../validations/paymentValidation');
const { ZodError } = require('zod');
const logger = require('../utils/logger');
const Razorpay = require('razorpay');

let razorpay = null;
if (process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET) {
  razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET,
  });
}

/**
 * Verify Razorpay payment signature
 */
exports.verifyPayment = async (req, res) => {
  try {
    const validatedData = verifyPaymentSchema.parse(req.body);
    const {
      razorpay_payment_id,
      razorpay_order_id,
      razorpay_signature
    } = validatedData;

    // Verify signature
    const secret = process.env.RAZORPAY_KEY_SECRET;
    const isProduction = process.env.NODE_ENV === 'production' || process.env.RENDER === 'true';
    const bypassEnabled = !isProduction && (process.env.BYPASS_PAYMENT_VERIFICATION === 'true' || process.env.NODE_ENV === 'development');

    let isVerified = false;
    if (secret) {
      const generatedSignature = crypto
        .createHmac('sha256', secret)
        .update(`${razorpay_order_id}|${razorpay_payment_id}`)
        .digest('hex');

      const generatedBuffer = Buffer.from(generatedSignature);
      const receivedBuffer = Buffer.from(razorpay_signature);

      isVerified =
        generatedBuffer.length === receivedBuffer.length &&
        crypto.timingSafeEqual(generatedBuffer, receivedBuffer);
    }

    if (!isVerified) {
      if (bypassEnabled) {
        logger.warn(`[BYPASS] Payment signature verification bypassed. order_id=${razorpay_order_id}, payment_id=${razorpay_payment_id}`);
        isVerified = true;
      } else {
        if (!secret) {
          return res.status(500).json({
            success: false,
            message: 'Server Razorpay configuration is incomplete'
          });
        }

        // Find the ride to set paymentStatus as failed
        const ride = await Ride.findOne({ razorpayOrderId: razorpay_order_id });
        if (ride) {
          // Enforce ownership check even for failed verifications
          if (ride.client.toString() !== req.user._id.toString()) {
            return res.status(403).json({
              success: false,
              message: 'Forbidden. You do not own this ride booking.'
            });
          }
          ride.paymentStatus = 'failed';
          await ride.save();
        }

        return res.status(400).json({
          success: false,
          message: 'Payment verification failed. Signature mismatch.'
        });
      }
    }

    // Find the corresponding ride by razorpayOrderId
    const ride = await Ride.findOne({ razorpayOrderId: razorpay_order_id });

    if (!ride) {
      return res.status(404).json({
        success: false,
        message: 'No booking found associated with this payment order ID'
      });
    }

    // Scope to Ride Owner (H-3)
    if (ride.client.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Forbidden. You do not own this ride booking.'
      });
    }

    if (ride.paymentStatus === 'authorized' || ride.paymentStatus === 'paid') {
      return res.status(400).json({
        success: false,
        message: 'Payment already verified.'
      });
    }

    // Check if signature has already been used to prevent replay attacks
    const signatureUsed = await Ride.exists({ razorpaySignature: razorpay_signature });
    if (signatureUsed) {
      logger.warn(`[REPLAY ATTACK DETECTED] Signature ${razorpay_signature} already used previously.`);
      return res.status(400).json({
        success: false,
        message: 'Payment verification failed. Replay attack detected.'
      });
    }

    // Verify order amount matches ride fare via Razorpay API to prevent parameter manipulation
    if (razorpay && !razorpay_order_id.startsWith('order_mock_')) {
      try {
        const razorpayOrderDetails = await razorpay.orders.fetch(razorpay_order_id);
        if (razorpayOrderDetails.amount !== Math.round(ride.fare * 100)) {
          logger.error(`[TAMPER DETECTED] Amount mismatch: Razorpay Order Amount (${razorpayOrderDetails.amount} paise) vs Ride Fare (${Math.round(ride.fare * 100)} paise).`);
          return res.status(400).json({
            success: false,
            message: 'Payment verification failed. Amount mismatch detected.'
          });
        }
      } catch (fetchError) {
        logger.warn(`[Razorpay Order Fetch Warning] Failed to fetch order details for validation from Razorpay, falling back to signature validation. order=${razorpay_order_id}: ${fetchError.message}`);
        // Do not crash/return 500 here since signature verification already passed
      }
    }

    // Update ride payment details and status
    ride.paymentStatus = 'authorized';
    ride.razorpayPaymentId = razorpay_payment_id;
    ride.razorpaySignature = razorpay_signature;
    
    await ride.save();

    // Structured audit log (Audit 13.1)
    logger.info('[PAYMENT_AUTHORIZED] rideId=%s | orderId=%s | paymentId=%s | amount=₹%s', ride._id, razorpay_order_id, razorpay_payment_id, ride.fare);

    // Create a transaction ledger record for the payment
    await Transaction.create({
      user: ride.client,
      ride: ride._id,
      amount: ride.fare,
      type: 'payment',
      paymentMethod: ride.paymentMethod || 'card',
      razorpayPaymentId: razorpay_payment_id,
      status: 'success'
    });

    // Dispatch invoice email asynchronously once verified and paid
    sendInvoiceEmail(ride).catch(err => logger.error('Failed to send online booking invoice email: %s', err.message));

    // Now broadcast the new booking notification to nearby drivers via Socket.io
    const io = req.app.get('io');
    if (io) {
      io.emit('new-booking', {
        _id: ride._id,
        pickupLocation: ride.pickupLocation,
        dropoffLocation: ride.dropoffLocation,
        pickupDate: ride.pickupDate,
        pickupTime: ride.pickupTime,
        vehicleType: ride.vehicleType,
        passengerDetails: ride.passengerDetails,
        fare: ride.fare,
        status: ride.status,
        paymentMethod: ride.paymentMethod,
        paymentStatus: ride.paymentStatus
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Payment verified successfully and booking active',
      ride
    });
  } catch (error) {

    // Zod Validation Errors
    if (error instanceof ZodError) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: error.errors,
      });
    }

    logger.error('Error verifying payment: %s', error.message);

    return res.status(500).json({
      success: false,
      message: 'Internal server error during payment verification',
      error:
        process.env.NODE_ENV === 'development'
          ? error.message
          : 'Internal Server Error'
    });
  }
};

/**
 * Initiate Razorpay Order for Wallet Deposit
 */
exports.depositWallet = async (req, res) => {
  try {
    const { amount } = req.body;
    if (!amount || isNaN(amount) || amount <= 0) {
      return res.status(400).json({ success: false, message: 'Please provide a valid deposit amount.' });
    }

    const isProduction = process.env.NODE_ENV === 'production' || process.env.RENDER === 'true';
    const bypassEnabled = !isProduction && (process.env.BYPASS_PAYMENT_VERIFICATION === 'true' || process.env.NODE_ENV === 'development');
    let razorpayOrder = null;

    if (!razorpay) {
      if (bypassEnabled) {
        const mockOrderId = `order_mock_${crypto.randomBytes(8).toString('hex')}`;
        razorpayOrder = {
          id: mockOrderId,
          amount: Math.round(amount * 100),
          currency: 'INR',
          key: 'rzp_test_mock'
        };
      } else {
        return res.status(500).json({ success: false, message: 'Razorpay integration is not configured on the server.' });
      }
    } else {
      try {
        const options = {
          amount: Math.round(amount * 100), // in paise
          currency: 'INR',
          receipt: `wallet_deposit_${Date.now()}`
        };

        const createdOrder = await razorpay.orders.create(options);
        razorpayOrder = {
          id: createdOrder.id,
          amount: createdOrder.amount,
          currency: createdOrder.currency,
          key: process.env.RAZORPAY_KEY_ID
        };
      } catch (razorpayError) {
        logger.error('Failed to create Razorpay wallet deposit order: %s', razorpayError.message);
        if (bypassEnabled) {
          const mockOrderId = `order_mock_${crypto.randomBytes(8).toString('hex')}`;
          razorpayOrder = {
            id: mockOrderId,
            amount: Math.round(amount * 100),
            currency: 'INR',
            key: 'rzp_test_mock'
          };
        } else {
          return res.status(500).json({ success: false, message: 'Failed to initiate wallet deposit with payment gateway.' });
        }
      }
    }

    // Create a pending transaction ledger record
    await Transaction.create({
      user: req.user._id,
      amount,
      type: 'deposit',
      paymentMethod: 'card', // default
      razorpayOrderId: razorpayOrder.id,
      status: 'pending'
    });

    return res.status(200).json({
      success: true,
      message: 'Wallet deposit initiated successfully',
      razorpayOrder
    });
  } catch (error) {
    logger.error('Error initiating wallet deposit: %s', error.message);
    return res.status(500).json({
      success: false,
      message: 'Failed to initiate wallet deposit',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal Server Error'
    });
  }
};

/**
 * Verify Razorpay Payment Signature for Wallet Deposit
 */
exports.verifyWallet = async (req, res) => {
  try {
    const {
      razorpay_payment_id,
      razorpay_order_id,
      razorpay_signature
    } = req.body;

    if (!razorpay_payment_id || !razorpay_order_id || !razorpay_signature) {
      return res.status(400).json({ success: false, message: 'Missing payment response credentials.' });
    }

    const secret = process.env.RAZORPAY_KEY_SECRET;
    const isProduction = process.env.NODE_ENV === 'production' || process.env.RENDER === 'true';
    const bypassEnabled = !isProduction && (process.env.BYPASS_PAYMENT_VERIFICATION === 'true' || process.env.NODE_ENV === 'development');

    let isVerified = false;
    if (secret) {
      // Verify signature
      const generatedSignature = crypto
        .createHmac('sha256', secret)
        .update(`${razorpay_order_id}|${razorpay_payment_id}`)
        .digest('hex');

      const generatedBuffer = Buffer.from(generatedSignature);
      const receivedBuffer = Buffer.from(razorpay_signature);

      isVerified =
        generatedBuffer.length === receivedBuffer.length &&
        crypto.timingSafeEqual(generatedBuffer, receivedBuffer);
    }

    if (!isVerified) {
      if (bypassEnabled) {
        logger.warn(`[BYPASS] Wallet payment signature verification bypassed. order_id=${razorpay_order_id}, payment_id=${razorpay_payment_id}`);
        isVerified = true;
      } else {
        if (!secret) {
          return res.status(500).json({ success: false, message: 'Server Razorpay configuration is incomplete' });
        }
        // Find transaction and mark as failed
        const txn = await Transaction.findOne({ razorpayOrderId: razorpay_order_id });
        if (txn) {
          txn.status = 'failed';
          await txn.save();
        }
        return res.status(400).json({ success: false, message: 'Payment verification failed. Signature mismatch.' });
      }
    }

    // Find the pending transaction
    const txn = await Transaction.findOne({ razorpayOrderId: razorpay_order_id, status: 'pending' });
    if (!txn) {
      return res.status(404).json({ success: false, message: 'Pending transaction record not found or already verified.' });
    }

    // Double check ownership
    if (txn.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Forbidden: You do not own this transaction.' });
    }

    // Check if signature/payment has already been used to prevent replay attacks
    const signatureUsed = await Transaction.exists({ razorpayPaymentId: razorpay_payment_id });
    if (signatureUsed) {
      logger.warn(`[REPLAY ATTACK DETECTED] Wallet signature already used. payment_id=${razorpay_payment_id}`);
      return res.status(400).json({
        success: false,
        message: 'Payment verification failed. Replay attack detected.'
      });
    }

    // Verify order amount matches transaction amount via Razorpay API to prevent parameter manipulation
    if (razorpay && !razorpay_order_id.startsWith('order_mock_')) {
      try {
        const razorpayOrderDetails = await razorpay.orders.fetch(razorpay_order_id);
        if (razorpayOrderDetails.amount !== Math.round(txn.amount * 100)) {
          logger.error(`[TAMPER DETECTED] Wallet Amount mismatch: Razorpay Order Amount (${razorpayOrderDetails.amount} paise) vs Txn Amount (${Math.round(txn.amount * 100)} paise).`);
          return res.status(400).json({
            success: false,
            message: 'Payment verification failed. Amount mismatch detected.'
          });
        }
      } catch (fetchError) {
        logger.warn(`[Razorpay Wallet Order Fetch Warning] Failed to fetch order details for validation from Razorpay, falling back to signature validation. order=${razorpay_order_id}: ${fetchError.message}`);
        // Do not crash/return 500 here since signature verification already passed
      }
    }

    // Mark transaction as successful
    txn.status = 'success';
    txn.razorpayPaymentId = razorpay_payment_id;
    await txn.save();

    // Increment user balance
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    user.walletBalance = (user.walletBalance || 0) + txn.amount;
    const updatedUser = await user.save();

    return res.status(200).json({
      success: true,
      message: 'Wallet balance successfully topped up',
      walletBalance: updatedUser.walletBalance,
      user: updatedUser.toJSON()
    });
  } catch (error) {
    logger.error('Error verifying wallet payment: %s', error.message);
    return res.status(500).json({
      success: false,
      message: 'Internal server error during payment verification',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal Server Error'
    });
  }
};

/**
 * Handle incoming Razorpay webhook events asynchronously (Phase 5)
 */
exports.razorpayWebhook = async (req, res) => {
  const WebhookEvent = require('../models/WebhookEvent');
  let webhookLog = null;
  try {
    const signature = req.headers['x-razorpay-signature'];
    const secret = process.env.RAZORPAY_WEBHOOK_SECRET;
    const isProduction = process.env.NODE_ENV === 'production' || process.env.RENDER === 'true';
    const bypassEnabled = !isProduction && (process.env.BYPASS_PAYMENT_VERIFICATION === 'true' || process.env.NODE_ENV === 'development');

    let isVerified = false;
    if (secret && signature) {
      const payloadString = req.rawBody || JSON.stringify(req.body);
      const shasum = crypto.createHmac('sha256', secret);
      shasum.update(payloadString);
      const digest = shasum.digest('hex');

      const expectedBuffer = Buffer.from(digest);
      const receivedBuffer = Buffer.from(signature);

      isVerified =
        expectedBuffer.length === receivedBuffer.length &&
        crypto.timingSafeEqual(expectedBuffer, receivedBuffer);
    }

    if (!isVerified) {
      if (bypassEnabled) {
        logger.warn('[BYPASS] Webhook verification bypassed.');
        isVerified = true;
      } else {
        if (!secret) {
          logger.error('[Razorpay Webhook] RAZORPAY_WEBHOOK_SECRET is not configured on the server.');
          return res.status(500).json({ success: false, message: 'Webhook secret not configured' });
        }
        if (!signature) {
          logger.warn('[Razorpay Webhook] Missing x-razorpay-signature header.');
          return res.status(400).json({ success: false, message: 'Missing signature header' });
        }
        logger.warn('[Razorpay Webhook] Webhook verification failed. Signature mismatch.');
        return res.status(400).json({ success: false, message: 'Invalid webhook signature' });
      }
    }

    const event = req.body.event;
    const payload = req.body.payload;
    const eventId = req.headers['x-razorpay-event-id'] || req.body.id || req.body.event_id;

    logger.info(`[Razorpay Webhook] Signature verified. Event ID: ${eventId}, Event Type: ${event}`);

    // Idempotency: skip already processed events
    if (eventId) {
      const exists = await WebhookEvent.findOne({ eventId });
      if (exists) {
        logger.info(`[Razorpay Webhook] Event ${eventId} already processed previously (Idempotency triggered).`);
        return res.status(200).json({ success: true, message: 'Duplicate event ignored.' });
      }

      // Log event to DB
      webhookLog = await WebhookEvent.create({
        eventId,
        event,
        payload: req.body,
        processed: false,
        status: 'failed'
      });
    }

    if (event === 'order.paid' || event === 'payment.captured') {
      let orderId = null;
      let paymentId = null;

      if (payload.order && payload.order.entity) {
        orderId = payload.order.entity.id;
      }
      if (payload.payment && payload.payment.entity) {
        paymentId = payload.payment.entity.id;
        orderId = orderId || payload.payment.entity.order_id;
      }

      if (!orderId) {
        logger.warn('[Razorpay Webhook] No orderId found in webhook payload');
        if (webhookLog) {
          webhookLog.processed = true;
          webhookLog.status = 'success';
          await webhookLog.save();
        }
        return res.status(200).json({ success: true, message: 'Ignored, no orderId' });
      }

      // A. Check if Ride Booking
      const ride = await Ride.findOne({ razorpayOrderId: orderId });
      if (ride) {
        if (ride.paymentStatus !== 'paid') {
          ride.paymentStatus = 'paid';
          if (paymentId) ride.razorpayPaymentId = paymentId;
          await ride.save();

          // Create transaction ledger record if missing
          const existingTxn = await Transaction.findOne({ razorpayPaymentId: paymentId });
          if (!existingTxn) {
            await Transaction.create({
              user: ride.client,
              ride: ride._id,
              amount: ride.fare,
              type: 'payment',
              paymentMethod: ride.paymentMethod || 'card',
              razorpayPaymentId: paymentId || 'webhook_captured',
              status: 'success'
            });
          }

          // Email invoice
          sendInvoiceEmail(ride).catch(err => logger.error('Failed to send webhook booking invoice email: %s', err.message));

          // Broadcast Socket.io notification
          const io = req.app.get('io');
          if (io) {
            io.emit('new-booking', {
              _id: ride._id,
              pickupLocation: ride.pickupLocation,
              dropoffLocation: ride.dropoffLocation,
              pickupDate: ride.pickupDate,
              pickupTime: ride.pickupTime,
              vehicleType: ride.vehicleType,
              passengerDetails: ride.passengerDetails,
              fare: ride.fare,
              status: ride.status,
              paymentMethod: ride.paymentMethod,
              paymentStatus: ride.paymentStatus
            });
          }
          logger.info(`[Razorpay Webhook] Webhook successfully processed ride payment for order: ${orderId}`);
        } else {
          logger.info(`[Razorpay Webhook] Ride payment already processed for order: ${orderId}`);
        }
      }

      // B. Check if Wallet Transaction
      const txn = await Transaction.findOne({ razorpayOrderId: orderId });
      if (txn) {
        if (txn.status === 'pending') {
          txn.status = 'success';
          if (paymentId) txn.razorpayPaymentId = paymentId;
          await txn.save();

          const user = await User.findById(txn.user);
          if (user) {
            user.walletBalance = (user.walletBalance || 0) + txn.amount;
            await user.save();
            logger.info(`[Razorpay Webhook] Webhook successfully credited wallet for user: ${user._id}, order: ${orderId}`);
          } else {
            logger.warn(`[Razorpay Webhook] User not found for transaction: ${txn._id}`);
          }
        } else {
          logger.info(`[Razorpay Webhook] Wallet transaction already processed for order: ${orderId}`);
        }
      }
    } else if (event === 'payment.failed') {
      let orderId = null;
      if (payload.payment && payload.payment.entity) {
        orderId = payload.payment.entity.order_id;
      }

      if (orderId) {
        const ride = await Ride.findOne({ razorpayOrderId: orderId });
        if (ride && ride.paymentStatus !== 'paid') {
          ride.paymentStatus = 'failed';
          await ride.save();
          logger.info(`[Razorpay Webhook] Webhook marked ride payment failed for order: ${orderId}`);
        }

        const txn = await Transaction.findOne({ razorpayOrderId: orderId, status: 'pending' });
        if (txn) {
          txn.status = 'failed';
          await txn.save();
          logger.info(`[Razorpay Webhook] Webhook marked wallet transaction failed for order: ${orderId}`);
        }
      }
    }

    if (webhookLog) {
      webhookLog.processed = true;
      webhookLog.status = 'success';
      await webhookLog.save();
    }
    return res.status(200).json({ success: true });
  } catch (error) {
    logger.error('Razorpay webhook handler error: %s', error.message);
    if (webhookLog) {
      webhookLog.processed = true;
      webhookLog.status = 'failed';
      webhookLog.errorMessage = error.message;
      await webhookLog.save();
    }
    return res.status(500).json({
      success: false,
      message: 'Internal server error processing webhook request'
    });
  }
};

/**
 * Fetch Transaction History for the logged-in user
 */
exports.getTransactions = async (req, res) => {
  try {
    const transactions = await Transaction.find({ user: req.user._id })
      .populate('ride', 'pickupLocation dropoffLocation vehicleType')
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: transactions.length,
      transactions
    });
  } catch (error) {
    logger.error('Error fetching transactions: %s', error.message);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch transaction history',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal Server Error'
    });
  }
};

/**
 * Transfer Wallet Balance (P2P to another user, or withdraw to UPI ID)
 */
exports.transferWallet = async (req, res) => {
  try {
    const { type, recipient, amount } = req.body;

    if (!amount || isNaN(amount) || amount <= 0) {
      return res.status(400).json({ success: false, message: 'Please enter a valid positive transfer amount.' });
    }

    const sender = await User.findById(req.user._id);
    if (!sender) {
      return res.status(404).json({ success: false, message: 'Sender user not found.' });
    }

    if (sender.walletBalance < amount) {
      return res.status(400).json({ success: false, message: 'Insufficient wallet balance.' });
    }

    if (type === 'wallet') {
      if (!recipient) {
        return res.status(400).json({ success: false, message: 'Recipient email or phone is required.' });
      }

      // Find recipient user
      const recipientUser = await User.findOne({
        $or: [
          { email: recipient.toLowerCase().trim() },
          { phone: recipient.trim() }
        ]
      });

      if (!recipientUser) {
        return res.status(404).json({ success: false, message: 'Recipient user not found on DMS.' });
      }

      if (recipientUser._id.toString() === sender._id.toString()) {
        return res.status(400).json({ success: false, message: 'Cannot transfer to yourself.' });
      }

      // Deduct from sender
      sender.walletBalance = Number((sender.walletBalance - amount).toFixed(2));
      const updatedSender = await sender.save();

      // Add to recipient
      recipientUser.walletBalance = Number((recipientUser.walletBalance + amount).toFixed(2));
      await recipientUser.save();

      const txnId = crypto.randomBytes(8).toString('hex');

      // Create transaction for sender
      await Transaction.create({
        user: sender._id,
        amount: amount,
        type: 'payment',
        paymentMethod: 'wallet',
        razorpayPaymentId: `tx_send_${txnId}`,
        status: 'success'
      });

      // Create transaction for recipient
      await Transaction.create({
        user: recipientUser._id,
        amount: amount,
        type: 'deposit',
        paymentMethod: 'wallet',
        razorpayPaymentId: `tx_recv_${txnId}`,
        status: 'success'
      });

      logger.info(`[WALLET TRANSFER SUCCESS] Transferred ₹${amount} from sender ${sender._id} to recipient ${recipientUser._id}`);

      return res.status(200).json({
        success: true,
        message: `Successfully transferred ₹${amount.toLocaleString()} to ${recipientUser.fullName}!`,
        walletBalance: updatedSender.walletBalance,
        user: updatedSender.toJSON()
      });

    } else if (type === 'upi') {
      if (!recipient) {
        return res.status(400).json({ success: false, message: 'Linked UPI ID is required for transfer.' });
      }

      // Deduct from sender
      sender.walletBalance = Number((sender.walletBalance - amount).toFixed(2));
      const updatedSender = await sender.save();

      const txnId = crypto.randomBytes(8).toString('hex');

      // Create transaction for sender
      await Transaction.create({
        user: sender._id,
        amount: amount,
        type: 'payment',
        paymentMethod: 'upi',
        razorpayPaymentId: `tx_upi_${txnId}`,
        status: 'success'
      });

      logger.info(`[UPI WITHDRAWAL SUCCESS] Withdrew ₹${amount} from user ${sender._id} to UPI ${recipient}`);

      return res.status(200).json({
        success: true,
        message: `Successfully transferred ₹${amount.toLocaleString()} to UPI ID ${recipient}!`,
        walletBalance: updatedSender.walletBalance,
        user: updatedSender.toJSON()
      });

    } else {
      return res.status(400).json({ success: false, message: 'Invalid transfer type.' });
    }

  } catch (error) {
    logger.error('Error transferring wallet balance: %s', error.message);
    return res.status(500).json({
      success: false,
      message: 'Failed to complete wallet transfer',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal Server Error'
    });
  }
};

