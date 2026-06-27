const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema(
  {
    transactionId: {
      type: String,
      default: null
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User is required for transaction ledger record']
    },
    wallet: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null
    },
    ride: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Ride',
      default: null
    },
    amount: {
      type: Number,
      required: [true, 'Transaction amount is required']
    },
    currency: {
      type: String,
      default: 'INR'
    },
    type: {
      type: String,
      enum: ['deposit', 'payment', 'refund'],
      required: [true, 'Transaction type must be deposit, payment, or refund']
    },
    paymentMethod: {
      type: String,
      enum: ['cash', 'card', 'upi', 'wallet'],
      required: [true, 'Payment method must be cash, card, upi, or wallet']
    },
    paymentGateway: {
      type: String,
      enum: ['razorpay', 'stripe', 'wallet', 'cash', 'none'],
      default: 'razorpay'
    },
    gatewayOrderId: {
      type: String,
      default: null
    },
    gatewayPaymentId: {
      type: String,
      default: null
    },
    gatewaySignature: {
      type: String,
      default: null
    },
    razorpayOrderId: {
      type: String,
      default: null
    },
    razorpayPaymentId: {
      type: String,
      default: null
    },
    razorpaySignature: {
      type: String,
      default: null
    },
    status: {
      type: String,
      enum: ['pending', 'success', 'failed'],
      default: 'pending'
    },
    metadata: {
      type: Map,
      of: mongoose.Schema.Types.Mixed,
      default: {}
    }
  },
  { timestamps: true }
);

// Indexes to speed up queries
transactionSchema.index({ user: 1 });
transactionSchema.index({ status: 1 });
transactionSchema.index({ user: 1, type: 1 });
transactionSchema.index({ ride: 1 });
transactionSchema.index({ createdAt: -1 });

// Production-ready partial unique indexes to support multiple initial null states
transactionSchema.index(
  { razorpayPaymentId: 1 },
  {
    unique: true,
    partialFilterExpression: {
      razorpayPaymentId: { $exists: true, $type: 'string' }
    }
  }
);

transactionSchema.index(
  { gatewayPaymentId: 1 },
  {
    unique: true,
    partialFilterExpression: {
      gatewayPaymentId: { $exists: true, $type: 'string' }
    }
  }
);

transactionSchema.index(
  { transactionId: 1 },
  {
    unique: true,
    partialFilterExpression: {
      transactionId: { $exists: true, $type: 'string' }
    }
  }
);

transactionSchema.index({ razorpayOrderId: 1 }, { sparse: true });
transactionSchema.index({ gatewayOrderId: 1 }, { sparse: true });

// Modern promise-based async pre-save hook (Mongoose v7 best practices, no callback parameters used)
transactionSchema.pre('save', async function () {
  if (!this.transactionId) {
    this.transactionId = `tx_${this._id}`;
  }

  // Populate wallet link if user field is set
  if (!this.wallet && this.user) {
    this.wallet = this.user;
  }

  // Synchronize legacy razorpay fields with generic gateway fields for compatibility
  if (this.razorpayOrderId && !this.gatewayOrderId) {
    this.gatewayOrderId = this.razorpayOrderId;
  }
  if (this.razorpayPaymentId && !this.gatewayPaymentId) {
    this.gatewayPaymentId = this.razorpayPaymentId;
  }
  if (this.razorpaySignature && !this.gatewaySignature) {
    this.gatewaySignature = this.razorpaySignature;
  }

  // Auto-fill payment gateway type if missing
  if (!this.paymentGateway) {
    if (this.paymentMethod === 'wallet') {
      this.paymentGateway = 'wallet';
    } else if (this.paymentMethod === 'cash') {
      this.paymentGateway = 'none';
    } else {
      this.paymentGateway = 'razorpay';
    }
  }
});

module.exports = mongoose.model('Transaction', transactionSchema);
