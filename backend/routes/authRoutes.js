const express = require('express');
const { register, login, getMe, logout, updateProfile, contactInquiry } = require('../controllers/authController');
const { protect, isApproved } = require('../middleware/authMiddleware');
const { loginLimiter, signupLimiter, otpVerificationLimiter } = require('../middlewares/rateLimiters');

const router = express.Router();

router.post('/register', signupLimiter, register);
router.post('/login', loginLimiter, login);
router.get('/me', protect, getMe);
router.post('/logout', logout);
router.put('/update-profile', protect, updateProfile);
router.post('/contact-inquiry', contactInquiry);

// OTP Verification Stub - Ready for production integration
router.post('/verify-otp', otpVerificationLimiter, (req, res) => {
  res.status(200).json({ success: true, message: 'OTP Verification successful (stub)' });
});

module.exports = router;
