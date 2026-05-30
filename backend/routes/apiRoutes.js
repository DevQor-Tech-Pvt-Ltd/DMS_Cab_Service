/**
 * DMS Cab Servicese - Secured API Routes
 * 
 * Enterprise-grade route structure with:
 * - Access/Refresh token authentication (authMiddleware / protect)
 * - Role-Based Access Control (authorize / roleMiddleware)
 * - IDOR prevention (ownershipMiddleware)
 * - Input validation (Zod schemas via validate middleware)
 * - Route-specific rate limiting
 * 
 * All user identification is derived from the authenticated JWT token (req.user),
 * NEVER from URL parameters or query strings.
 */

const express = require('express');
const router = express.Router();

// Security Middlewares
const { protect, authorize, ownershipMiddleware } = require('../middleware/authMiddleware');
const validate = require('../middleware/validationMiddleware');

// Validation Schemas
const {
  signupSchema,
  loginSchema,
  rideBookingSchema,
  updateProfileSchema,
  otpVerificationSchema,
} = require('../validations/validationSchemas');

// Rate Limiters
const { loginLimiter, signupLimiter, rideBookingLimiter } = require('../middlewares/rateLimiters');

// Controllers
const authController = require('../controllers/authController');
const rideController = require('../controllers/rideController');
const adminController = require('../controllers/adminController');

// ============================================================
//  PUBLIC AUTH ROUTES (no token required)
// ============================================================

router.post('/auth/register', signupLimiter, validate(signupSchema), authController.register);
router.post('/auth/login', loginLimiter, validate(loginSchema), authController.login);
router.post('/auth/logout', authController.logout);
router.post('/auth/contact-inquiry', authController.contactInquiry);

// ============================================================
//  AUTHENTICATED USER ROUTE (GET /api/me)
//  Returns currently logged-in user from JWT. Never accepts userId from frontend.
// ============================================================

router.get('/me', protect, authController.getMe);

// ============================================================
//  CLIENT ROUTES (/api/client/*)
//  Only accessible by: role=client
// ============================================================

router.get('/client/profile', protect, authorize('client'), authController.getMe);
router.put('/client/profile', protect, authorize('client'), validate(updateProfileSchema), authController.updateProfile);

router.get('/client/rides', protect, authorize('client'), rideController.getRides);
router.get('/client/rides/:rideId', protect, authorize('client'), ownershipMiddleware, rideController.getRideById);
router.post('/client/rides', protect, authorize('client'), rideBookingLimiter, validate(rideBookingSchema), rideController.createRide);
router.delete('/client/rides/:rideId', protect, authorize('client'), ownershipMiddleware, rideController.deleteRide);

// ============================================================
//  DRIVER ROUTES (/api/driver/*)
//  Only accessible by: role=driver
// ============================================================

router.get('/driver/profile', protect, authorize('driver'), authController.getMe);
router.get('/driver/rides', protect, authorize('driver'), rideController.getRides);

router.put('/driver/rides/:rideId/accept', protect, authorize('driver'), rideController.acceptRide);
router.patch('/driver/rides/:rideId/arrived', protect, authorize('driver'), rideController.driverArrived);
router.post('/driver/rides/:rideId/verify-otp', protect, authorize('driver'), validate(otpVerificationSchema), rideController.verifyOtp);
router.post('/driver/rides/:rideId/resend-otp', protect, authorize('driver'), rideController.resendOtp);
router.patch('/driver/rides/:rideId/complete', protect, authorize('driver'), rideController.completeRide);

// ============================================================
//  ADMIN ROUTES (/api/admin/*)
//  Only accessible by: role=admin
// ============================================================

router.get('/admin/dashboard', protect, authorize('admin'), adminController.getDashboardStats);
router.get('/admin/users', protect, authorize('admin'), adminController.getAllUsers);
router.get('/admin/rides', protect, authorize('admin'), adminController.getAllRides);
router.get('/admin/drivers', protect, authorize('admin'), adminController.getAllDrivers);

router.get('/admin/pending-drivers', protect, authorize('admin'), adminController.getPendingDrivers);
router.get('/admin/approved-drivers', protect, authorize('admin'), adminController.getApprovedDrivers);
router.patch('/admin/approve-driver/:driverId', protect, authorize('admin'), adminController.approveDriver);
router.patch('/admin/reject-driver/:driverId', protect, authorize('admin'), adminController.rejectDriver);
router.delete('/admin/users/:id', protect, authorize('admin'), adminController.deleteUser);

module.exports = router;
