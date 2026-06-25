const express = require('express');
const {
  createRide,
  acceptRide,
  cancelRide,
  getRides,
  driverArrived,
  verifyOtp,
  resendOtp,
  completeRide,
  rateRide,
  deleteRide,
  calculateFares,
  geocodeAddress
} = require('../controllers/rideController');
const { protect, authorize, ownershipMiddleware } = require('../middleware/authMiddleware');
const { rideBookingLimiter } = require('../middleware/rateLimiters');
const validate = require('../middleware/validationMiddleware');
const { rideBookingSchema, otpVerificationSchema } = require('../validations/validationSchemas');

const router = express.Router();

// Apply protect middleware to all routes
router.use(protect);

// Fare estimation & Geocoding proxy
router.post('/calculate-fare', authorize('client'), calculateFares);
router.get('/geocode', geocodeAddress);

// Client-only: Create ride bookings
router.post('/', authorize('client'), rideBookingLimiter, validate(rideBookingSchema), createRide);

// All authenticated roles can list their rides
router.get('/', getRides);

// Driver-only: ride lifecycle actions
router.put('/:id/accept', authorize('driver'), acceptRide);
router.put('/:id/cancel', authorize('driver', 'client'), cancelRide);
router.patch('/:id/driver-arrived', authorize('driver'), driverArrived);
router.post('/verify-otp', authorize('driver'), rideBookingLimiter, validate(otpVerificationSchema), verifyOtp);
router.post('/:id/resend-otp', resendOtp);
router.patch('/:id/complete', authorize('driver'), completeRide);

// Client-only: rate and delete rides
router.patch('/:id/rate', authorize('client'), rideBookingLimiter, rateRide);
router.delete('/:id', authorize('client'), ownershipMiddleware, deleteRide);

module.exports = router;
