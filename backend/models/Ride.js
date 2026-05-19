const mongoose = require('mongoose');

const rideSchema = new mongoose.Schema(
  {
    client: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    driver: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    pickupLocation: {
      type: String,
      required: true,
    },
    dropoffLocation: {
      type: String,
      required: true,
    },
    pickupDate: {
      type: String,
      required: true,
    },
    pickupTime: {
      type: String,
      required: true,
    },
    vehicleType: {
      type: String,
      required: true,
    },
    passengerDetails: {
      fullName: { type: String, required: true },
      email: { type: String, required: true },
      phone: { type: String, required: true },
      specialInstructions: { type: String, default: '' },
    },
    paymentMethod: {
      type: String,
      enum: ['cash', 'card', 'upi'],
      default: 'cash',
    },
    paymentStatus: {
      type: String,
      enum: ['pending', 'paid', 'failed'],
      default: 'pending',
    },
    razorpayOrderId: {
      type: String,
      default: null,
    },
    razorpayPaymentId: {
      type: String,
      default: null,
    },
    razorpaySignature: {
      type: String,
      default: null,
    },
    fare: {
      type: Number,
      required: true,
    },
    status: {
      type: String,
      enum: ['pending', 'accepted', 'driver_assigned', 'driver_arrived', 'ride_started', 'completed', 'cancelled'],
      default: 'pending',
    },
    rideOtp: {
      type: String,
      default: null,
    },
    otpVerified: {
      type: Boolean,
      default: false,
    },
    otpExpiresAt: {
      type: Date,
      default: null,
    },
    otpAttempts: {
      type: Number,
      default: 0,
    },
    rideStartedAt: {
      type: Date,
      default: null,
    },
    otpAuditLogs: [
      {
        attemptedAt: { type: Date, default: Date.now },
        otpEntered: { type: String },
        success: { type: Boolean },
        ipAddress: { type: String }
      }
    ],
  },
  { timestamps: true }
);

module.exports = mongoose.model('Ride', rideSchema);
