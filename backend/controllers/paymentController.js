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
    if (!secret) {
      return res.status(500).json({
        success: false,
        message: 'Server Razorpay configuration is incomplete'
      });
    }

    const generatedSignature = crypto
      .createHmac('sha256', secret)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest('hex');

    const generatedBuffer = Buffer.from(generatedSignature);
    const receivedBuffer = Buffer.from(razorpay_signature);

    const isVerified =
      generatedBuffer.length === receivedBuffer.length &&
      crypto.timingSafeEqual(generatedBuffer, receivedBuffer);

    if (!isVerified) {
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

    if (ride.paymentStatus === 'paid') {
      return res.status(400).json({
        success: false,
        message: 'Payment already verified.'
      });
    }
    // Update ride payment details and status
    ride.paymentStatus = 'paid';
    ride.razorpayPaymentId = razorpay_payment_id;
    ride.razorpaySignature = razorpay_signature;
    
    await ride.save();

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

    if (!razorpay) {
      return res.status(500).json({ success: false, message: 'Razorpay integration is not configured on the server.' });
    }

    const options = {
      amount: Math.round(amount * 100), // in paise
      currency: 'INR',
      receipt: `wallet_deposit_${Date.now()}`
    };

    const razorpayOrder = await razorpay.orders.create(options);

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
      razorpayOrder: {
        id: razorpayOrder.id,
        amount: razorpayOrder.amount,
        currency: razorpayOrder.currency,
        key: process.env.RAZORPAY_KEY_ID
      }
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
    if (!secret) {
      return res.status(500).json({ success: false, message: 'Server Razorpay configuration is incomplete' });
    }

    // Verify signature
    const generatedSignature = crypto
      .createHmac('sha256', secret)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest('hex');

    const generatedBuffer = Buffer.from(generatedSignature);
    const receivedBuffer = Buffer.from(razorpay_signature);

    const isVerified =
      generatedBuffer.length === receivedBuffer.length &&
      crypto.timingSafeEqual(generatedBuffer, receivedBuffer);

    if (!isVerified) {
      // Find transaction and mark as failed
      const txn = await Transaction.findOne({ razorpayOrderId: razorpay_order_id });
      if (txn) {
        txn.status = 'failed';
        await txn.save();
      }
      return res.status(400).json({ success: false, message: 'Payment verification failed. Signature mismatch.' });
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
