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
    pickupDateTime: {
      type: Date,
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
      enum: ['cash', 'card', 'upi', 'wallet'],
      default: 'cash',
    },
    paymentStatus: {
      type: String,
      enum: ['pending', 'authorized', 'paid', 'failed', 'refunded', 'unpaid'],
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
      select: false,
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
      select: false,
      set: function (val) {
        if (!val) return val;
        const { encrypt } = require('../utils/crypto');
        return encrypt(val);
      },
      get: function (val) {
        if (!val) return val;
        const { decrypt } = require('../utils/crypto');
        return decrypt(val);
      }
    },
    rideOtpHash: {
      type: String,
      default: null,
      select: false,
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
    completedAt: {
      type: Date,
      default: null,
    },
    rating: {
      type: Number,
      min: 1,
      max: 5,
    },
    feedback: {
      type: String,
      default: '',
    },
    ratingTags: {
      type: [String],
      default: [],
    },
    otpAuditLogs: {
      type: [
        {
          attemptedAt: { type: Date, default: Date.now },
          otpMasked: { type: String },
          success: { type: Boolean },
          ipAddress: { type: String }
        }
      ],
      select: false
    },
    otpLastSentAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
    toJSON: { getters: true },
    toObject: { getters: true }
  }
);

// Pre-validate middleware to combine string pickupDate and pickupTime into unified Date field
rideSchema.pre('validate', function () {
  if (this.pickupDate && this.pickupTime) {
    try {
      const combined = new Date(`${this.pickupDate}T${this.pickupTime}`);
      if (!isNaN(combined.getTime())) {
        this.pickupDateTime = combined;
      }
    } catch (err) {
      // ignore
    }
  }
});

// INDEXES FOR PERFORMANCE & FAST QUERIES
rideSchema.index({ client: 1 });
rideSchema.index({ driver: 1 });
rideSchema.index({ status: 1 });
rideSchema.index({ paymentStatus: 1 });
rideSchema.index({ razorpayOrderId: 1 }, { unique: true, sparse: true });
rideSchema.index({ client: 1, status: 1 });
rideSchema.index({ driver: 1, status: 1 });
rideSchema.index({ status: 1, paymentMethod: 1, paymentStatus: 1 });
rideSchema.index({ createdAt: -1 });
rideSchema.index({ pickupDateTime: 1 });

module.exports = mongoose.model('Ride', rideSchema);
