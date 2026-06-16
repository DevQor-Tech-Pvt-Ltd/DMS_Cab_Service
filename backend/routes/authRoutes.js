const express = require('express');
const { register, login, getMe, logout, updateProfile, contactInquiry, deleteAccount } = require('../controllers/authController');
const { protect, isApproved } = require('../middleware/authMiddleware');
const { loginLimiter, signupLimiter, contactInquiryLimiter } = require('../middleware/rateLimiters');
const validate = require('../middleware/validationMiddleware');
const { signupSchema, loginSchema, updateProfileSchema } = require('../validations/validationSchemas');

const router = express.Router();

router.post('/register', signupLimiter, validate(signupSchema), register);
router.post('/login', loginLimiter, validate(loginSchema), login);
router.get('/me', protect, getMe);
router.post('/logout', protect, logout);
router.put('/update-profile', protect, validate(updateProfileSchema), updateProfile);
router.delete('/delete-account', protect, deleteAccount);
router.post('/contact-inquiry', contactInquiryLimiter, contactInquiry);

module.exports = router;
