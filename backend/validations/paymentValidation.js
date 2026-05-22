const { z } = require('zod');

const verifyPaymentSchema = z.object({
  razorpay_payment_id: z.string().trim().min(1).max(200),
  razorpay_order_id: z.string().trim().min(1).max(200),
  razorpay_signature: z.string().trim().min(1).max(200),
});

module.exports = {
  verifyPaymentSchema,
};