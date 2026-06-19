const express = require('express');
const { verifyPayment, depositWallet, verifyWallet } = require('../controllers/paymentController');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

// Route for verifying Razorpay payments
router.post('/verify', protect, verifyPayment);

// Routes for wallet balance deposit and verification
router.post('/wallet/deposit', protect, depositWallet);
router.post('/wallet/verify', protect, verifyWallet);

module.exports = router;
