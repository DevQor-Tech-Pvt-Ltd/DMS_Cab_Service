const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User is required for transaction ledger record']
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
    type: {
      type: String,
      enum: ['deposit', 'payment', 'refund'],
      required: [true, 'Transaction type must be deposit, payment, or refund']
    },
    paymentMethod: {
      type: String,
      enum: ['cash', 'card', 'upi'],
      required: [true, 'Payment method must be cash, card, or upi']
    },
    razorpayPaymentId: {
      type: String,
      default: null
    },
    status: {
      type: String,
      enum: ['pending', 'success', 'failed'],
      default: 'pending'
    }
  },
  { timestamps: true }
);

// Indexes to speed up queries
transactionSchema.index({ user: 1, type: 1 });
transactionSchema.index({ ride: 1 });
transactionSchema.index({ createdAt: -1 });

module.exports = mongoose.model('Transaction', transactionSchema);
