const crypto = require('crypto');
const Ride = require('../models/Ride');
const Transaction = require('../models/Transaction');
const { sendInvoiceEmail } = require('../utils/emailService');
const { verifyPaymentSchema } = require('../validations/paymentValidation');
const { ZodError } = require('zod');
const logger = require('../utils/logger');

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
