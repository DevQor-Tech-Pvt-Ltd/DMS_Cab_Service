const express = require('express');
const { register, login, getMe, logout, updateProfile, contactInquiry, deleteAccount, sendPhoneOtp, verifyPhoneOtp, emailHealth } = require('../controllers/authController');
const { protect, isApproved } = require('../middleware/authMiddleware');
const { loginLimiter, signupLimiter, contactInquiryLimiter } = require('../middleware/rateLimiters');
const validate = require('../middleware/validationMiddleware');
const { signupSchema, loginSchema, updateProfileSchema, contactInquirySchema } = require('../validations/validationSchemas');

const router = express.Router();

router.post('/register', signupLimiter, validate(signupSchema), register);
router.post('/login', loginLimiter, validate(loginSchema), login);
router.post('/phone-login/send', loginLimiter, sendPhoneOtp);
router.post('/phone-login/verify', loginLimiter, verifyPhoneOtp);
router.get('/me', protect, getMe);
router.post('/logout', protect, logout);
router.put('/update-profile', protect, validate(updateProfileSchema), updateProfile);
router.delete('/delete-account', protect, deleteAccount);
router.post('/contact-inquiry', contactInquiryLimiter, validate(contactInquirySchema), contactInquiry);
router.get('/email-health', emailHealth);

module.exports = router;
