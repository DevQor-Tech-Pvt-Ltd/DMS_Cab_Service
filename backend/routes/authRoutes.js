const express = require('express');
const { register, login, getMe, logout, updateProfile, contactInquiry, deleteAccount } = require('../controllers/authController');
const { protect, isApproved } = require('../middleware/authMiddleware');
const { loginLimiter, signupLimiter, otpVerificationLimiter } = require('../middlewares/rateLimiters');
const validate = require('../middleware/validationMiddleware');
const { signupSchema, loginSchema, updateProfileSchema } = require('../validations/validationSchemas');

const router = express.Router();

router.post('/register', signupLimiter, validate(signupSchema), register);
router.post('/login', loginLimiter, validate(loginSchema), login);
router.get('/me', protect, getMe);
router.post('/logout', logout);
router.put('/update-profile', protect, validate(updateProfileSchema), updateProfile);
router.delete('/delete-account', protect, deleteAccount);
router.post('/contact-inquiry', contactInquiry);

// OTP Verification Stub - Ready for production integration
router.post('/verify-otp', otpVerificationLimiter, (req, res) => {
  res.status(200).json({ success: true, message: 'OTP Verification successful (stub)' });
});

module.exports = router;
