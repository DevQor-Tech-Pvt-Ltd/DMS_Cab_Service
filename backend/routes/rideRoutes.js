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
  deleteRide
} = require('../controllers/rideController');
const { protect } = require('../middleware/authMiddleware');
const { rideBookingLimiter } = require('../middlewares/rateLimiters');

const router = express.Router();

// Apply protect middleware to all routes
router.use(protect);

// Apply ride booking rate limiter on ride creation routes
router.post('/', rideBookingLimiter, createRide);
router.post('/book', rideBookingLimiter, createRide); // Supports both /rides/ and /rides/book path variations

router.get('/', getRides);
router.put('/:id/accept', acceptRide);
router.put('/:id/cancel', cancelRide);
router.patch('/:id/driver-arrived', driverArrived);
router.post('/verify-otp', verifyOtp);
router.post('/:id/resend-otp', resendOtp);
router.patch('/:id/complete', completeRide);
router.patch('/:id/rate', rateRide);
router.delete('/:id', deleteRide);

module.exports = router;
