const mongoose = require('mongoose');

const webhookEventSchema = new mongoose.Schema(
  {
    eventId: {
      type: String,
      required: true,
      unique: true,
      index: true
    },
    event: {
      type: String,
      required: true
    },
    payload: {
      type: Object,
      required: true
    },
    processed: {
      type: Boolean,
      default: false
    },
    status: {
      type: String,
      enum: ['success', 'failed'],
      default: 'success'
    },
    errorMessage: {
      type: String,
      default: null
    }
  },
  { timestamps: true }
);

// TTL index to automatically remove event logs after 30 days
webhookEventSchema.index({ createdAt: 1 }, { expireAfterSeconds: 2592000 });

module.exports = mongoose.model('WebhookEvent', webhookEventSchema);
