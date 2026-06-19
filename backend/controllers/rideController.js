const crypto = require('crypto');
const Ride = require('../models/Ride');
const Transaction = require('../models/Transaction');
const Razorpay = require('razorpay');
const { sendInvoiceEmail, sendOtpEmail } = require('../utils/emailService');
const bcrypt = require('bcryptjs');
const logger = require('../utils/logger');
const cache = require('../utils/cache');
const User = require('../models/User');

let razorpay = null;
if (process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET) {
  razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET,
  });
}

// Create a new luxury ride booking
exports.createRide = async (req, res) => {
  try {
    const {
      pickupLocation,
      dropoffLocation,
      pickupDate,
      pickupTime,
      vehicleType,
      passengerDetails,
      paymentMethod,
    } = req.body;

    // Calculate a premium dynamic fare based on pickup/dropoff distance & vehicle selection (S-1)
    const calculateFare = (pickup, dropoff, vType) => {
      const combinedStr = (pickup || '') + (dropoff || '');
      let hash = 0;
      for (let i = 0; i < combinedStr.length; i++) {
        hash += combinedStr.charCodeAt(i);
      }
      const distanceKm = 5 + (hash % 41); // deterministic mock distance between 5 and 45 km
      
      let basePrice = 500;
      let perKmPrice = 40;
      
      const vehicle = (vType || '').toLowerCase();
      if (vehicle.includes('mercedes')) {
        basePrice = 1500;
        perKmPrice = 80;
      } else if (vehicle.includes('bmw')) {
        basePrice = 1200;
        perKmPrice = 70;
      } else if (vehicle.includes('audi')) {
        basePrice = 1000;
        perKmPrice = 65;
      } else if (vehicle.includes('suv')) {
        basePrice = 800;
        perKmPrice = 50;
      }
      
      return basePrice + Math.round(distanceKm * perKmPrice);
    };

    const calculatedFare = calculateFare(pickupLocation, dropoffLocation, vehicleType);
    const isOnlinePayment = paymentMethod === 'card' || paymentMethod === 'upi';

    // Verify wallet balance first
    let updatedUser = null;
    if (paymentMethod === 'wallet') {
      const user = await User.findById(req.user._id);
      if (!user) {
        return res.status(404).json({ success: false, message: 'User not found' });
      }
      if (user.walletBalance < calculatedFare) {
        return res.status(400).json({
          success: false,
          message: `Insufficient wallet balance. Your balance is ₹${user.walletBalance.toLocaleString()}, but the fare is ₹${calculatedFare.toLocaleString()}.`
        });
      }
      user.walletBalance -= calculatedFare;
      updatedUser = await user.save();
    }

    const ride = new Ride({
      client: req.user._id,
      pickupLocation,
      dropoffLocation,
      pickupDate,
      pickupTime,
      vehicleType,
      passengerDetails,
      paymentMethod: paymentMethod || 'cash',
      fare: calculatedFare,
      status: 'pending',
      paymentStatus: paymentMethod === 'wallet' ? 'paid' : 'pending',
    });

    // If it's an online payment, generate a Razorpay order
    let razorpayOrder = null;
    if (isOnlinePayment) {
      if (!razorpay) {
        throw new Error('Razorpay integration is not configured on the server.');
      }

      const options = {
        amount: calculatedFare * 100, // in paise
        currency: 'INR',
        receipt: `receipt_${Date.now()}`,
      };

      razorpayOrder = await razorpay.orders.create(options);
      ride.razorpayOrderId = razorpayOrder.id;
    }

    await ride.save();

    // Invalidate dashboard stats cache
    cache.clearDashboardCache();

    // Only broadcast the socket event immediately if it's cash or wallet!
    // For card/upi, we will broadcast AFTER verification in verifyPayment controller
    if (!isOnlinePayment) {
      const io = req.app.get('io');
      if (io) {
        io.emit('new-booking', {
          _id: ride._id,
          pickupLocation: ride.pickupLocation,
          dropoffLocation: ride.dropoffLocation,
          pickupDate: ride.pickupDate,
          pickupTime: ride.pickupTime,
          vehicleType: ride.vehicleType,
          passengerDetails: ride.passengerDetails,
          fare: ride.fare,
          status: ride.status,
          paymentMethod: ride.paymentMethod,
          paymentStatus: ride.paymentStatus,
        });
      }

      // If paymentMethod is wallet, create a transaction record for it!
      if (paymentMethod === 'wallet') {
        await Transaction.create({
          user: req.user._id,
          ride: ride._id,
          amount: ride.fare,
          type: 'payment',
          paymentMethod: 'wallet',
          status: 'success'
        });
      }

      // Dispatch invoice email to client asynchronously for cash/wallet bookings
      sendInvoiceEmail(ride).catch(err => logger.error('Failed to send cash/wallet booking invoice email: %s', err.message));
    }

    return res.status(201).json({
      success: true,
      message: isOnlinePayment
        ? 'Ride booked, payment order initiated'
        : 'Ride booked successfully, notifying drivers',
      ride,
      user: updatedUser ? updatedUser.toJSON() : undefined,
      razorpayOrder: razorpayOrder ? {
        id: razorpayOrder.id,
        amount: razorpayOrder.amount,
        currency: razorpayOrder.currency,
        key: process.env.RAZORPAY_KEY_ID
      } : null
    });
  } catch (error) {
    logger.error('Error creating ride: %s', error.message);
    return res.status(500).json({
      success: false,
      message: 'Failed to create ride booking',
      error:
        process.env.NODE_ENV === 'development'
          ? error.message
          : 'Internal Server Error'
    });
  }
};

// Accept an available luxury ride booking with secure OTP generation & dispatch
exports.acceptRide = async (req, res) => {
  try {
    // Securely generate a 4-digit OTP
    const secureOtp = crypto.randomInt(1000, 10000).toString();
    // Hash OTP before storing
    const hashedOtp = await bcrypt.hash(secureOtp, 10);
    // Expiry time 5 minutes window
    const otpExpiryTime = new Date(Date.now() + 5 * 60 * 1000);

    // Atomically find the ride and update status to driver_assigned
    const rideId = req.params.id || req.params.rideId;
    const ride = await Ride.findOneAndUpdate(
      { _id: rideId, status: 'pending' },
      {
        driver: req.user._id,
        status: 'driver_assigned',
        rideOtp: secureOtp,
        rideOtpHash: hashedOtp,
        otpVerified: false,
        otpExpiresAt: otpExpiryTime,
        otpAttempts: 0
      },
      { new: true }
    );

    if (!ride) {
      return res.status(400).json({
        success: false,
        message: 'Ride has already been taken by another chauffeur or does not exist.',
      });
    }

    // Populate newly assigned driver and client details
    await ride.populate('client', 'fullName email phone');
    await ride.populate('driver', 'fullName phone vehicleNumber vehicleType');

    // Invalidate dashboard stats cache
    cache.clearDashboardCache();

    // Broadcast that booking was accepted in real-time
    const io = req.app.get('io');
    if (io) {
      io.emit('booking-accepted', {
        rideId: ride._id,
        driverId: req.user._id,
        driverName: req.user.fullName,
      });

      // Emit client dashboard status change to the specific ride room (C-2)
      io.to(`ride_${ride._id}`).emit(`ride_status_${ride._id}`, {
        status: 'driver_assigned',
        driver: ride.driver,
        otpSent: true,
        otpExpiresAt: ride.otpExpiresAt
      });
    }

    // Send Ride Start OTP via Nodemailer asynchronously in the background
    sendOtpEmail(ride, secureOtp, req.user.fullName)
      .then(sent => {
        if (!sent) {
          logger.warn(`[OTP] Email failed to send for ride ${ride._id}`);
        }
      })
      .catch(err => {
        logger.error(`[OTP] Error sending email for ride ${ride._id}: %s`, err.message);
      });

    return res.status(200).json({
      success: true,
      message: 'You have accepted the ride. Ride verification OTP has been emailed to the client.',
      emailSent: true,
      ride,
    });
  } catch (error) {
    logger.error('Error accepting ride: %s', error.message);
    return res.status(500).json({
      success: false,
      message: 'Failed to accept ride',
      error:
        process.env.NODE_ENV === 'development'
          ? error.message
          : 'Internal Server Error'
    });
  }
};

// Driver Arrived at client pickup location
exports.driverArrived = async (req, res) => {
  try {
    const ride = await Ride.findOne({ _id: req.params.id || req.params.rideId, driver: req.user._id });

    if (!ride) {
      return res.status(404).json({ success: false, message: 'Active booking not found for this chauffeur.' });
    }

    if (ride.status !== 'driver_assigned') {
      return res.status(400).json({
        success: false,
        message: `Cannot trigger arrival because current status is: ${ride.status}`
      });
    }

    // Generate fresh secure 4-digit code
    const secureOtp = crypto.randomInt(1000, 10000).toString();
    const hashedOtp = await bcrypt.hash(secureOtp, 10);
    const otpExpiryTime = new Date(Date.now() + 5 * 60 * 1000);

    ride.status = 'driver_arrived';
    ride.rideOtp = secureOtp;
    ride.rideOtpHash = hashedOtp;
    ride.otpAttempts = 0;
    ride.otpExpiresAt = otpExpiryTime;
    ride.otpLastSentAt = new Date();
    await ride.save();

    // Populate client and driver details
    await ride.populate('client', 'fullName email phone');
    await ride.populate('driver', 'fullName phone vehicleNumber vehicleType');

    // Invalidate dashboard stats cache
    cache.clearDashboardCache();

    // Broadcast real-time status change to the client room (C-2)
    const io = req.app.get('io');
    if (io) {
      io.to(`ride_${ride._id}`).emit(`ride_status_${ride._id}`, {
        status: 'driver_arrived',
        otpSent: true,
        otpExpiresAt: ride.otpExpiresAt
      });
    }

    // Dispatch email template to client asynchronously
    sendOtpEmail(ride, secureOtp, req.user.fullName)
      .then(sent => {
        if (!sent) {
          logger.warn(`[OTP ARRIVAL] Email failed to send for ride ${ride._id}`);
        }
      })
      .catch(err => {
        logger.error(`[OTP ARRIVAL] Error sending email for ride ${ride._id}: %s`, err.message);
      });

    return res.status(200).json({
      success: true,
      message: 'Status updated to Driver Arrived. Ride verification OTP has been emailed to the client.',
      emailSent: true,
      ride
    });
  } catch (error) {
    logger.error('Error in driverArrived: %s', error.message);
    return res.status(500).json({
      success: false,
      message: 'Failed to update chauffeur status',
      error:
        process.env.NODE_ENV === 'development'
          ? error.message
          : 'Internal Server Error'
    });
  }
};

// Verify OTP to start the luxury ride
exports.verifyOtp = async (req, res) => {
  try {
    const { bookingId, otp } = req.body;
    const resolvedRideId = bookingId || req.params.id || req.params.rideId;
    const ipAddress = req.ip || req.headers['x-forwarded-for'] || 'unknown';

    if (!resolvedRideId || !otp) {
      return res.status(400).json({ success: false, message: 'Booking ID and OTP code are required.' });
    }

    const ride = await Ride.findOne({
      _id: resolvedRideId,
      driver: req.user._id
    });
    if (!ride) {
      return res.status(404).json({ success: false, message: 'Booking not found.' });
    }
    if (ride.status !== 'driver_arrived') {
      return res.status(400).json({
        success: false,
        message: 'OTP verification is not allowed at this stage.'
      });
    }

    // Expiry verification
    if (ride.otpExpiresAt && new Date() > ride.otpExpiresAt) {
      return res.status(400).json({ success: false, message: 'OTP has expired. Please request a new one.' });
    }

    // Bruteforce defense: limit to max 5 verification attempts
    if (ride.otpAttempts >= 5) {
      return res.status(400).json({
        success: false,
        message: 'Maximum OTP attempts reached (5). Please request a resend to generate a fresh OTP.'
      });
    }

    // Increment attempts
    ride.otpAttempts += 1;

    const isMatch = await bcrypt.compare(
      otp.trim(),
      ride.rideOtpHash
    );

    // Create Audit Log record
    ride.otpAuditLogs.push({
      otpMasked: otp.slice(0, 2) + '****',
      success: isMatch,
      ipAddress
    });

    // Keep only latest 10 OTP logs
    if (ride.otpAuditLogs.length > 10) {
      ride.otpAuditLogs.shift();
    }

    if (!isMatch) {
      await ride.save();
      return res.status(400).json({
        success: false,
        message: `Invalid OTP code. Attempts remaining: ${5 - ride.otpAttempts}`
      });
    }

    // Valid OTP verification flow
    ride.otpVerified = true;
    ride.status = 'ride_started';
    ride.rideStartedAt = new Date();
    ride.rideOtp = null; // Clear plaintext OTP field (H-1)
    ride.rideOtpHash = null;
    ride.otpExpiresAt = null;

    await ride.save();

    await ride.populate('client', 'fullName email phone');
    await ride.populate('driver', 'fullName phone vehicleNumber vehicleType');

    // Invalidate dashboard stats cache
    cache.clearDashboardCache();

    // Notify client in room in real-time (C-2)
    const io = req.app.get('io');
    if (io) {
      io.to(`ride_${ride._id}`).emit(`ride_status_${ride._id}`, {
        status: 'ride_started',
        otpVerified: true,
        rideStartedAt: ride.rideStartedAt
      });
    }

    return res.status(200).json({
      success: true,
      message: 'OTP verified successfully. Ride has officially started!',
      ride
    });
  } catch (error) {
    logger.error('Error verifying OTP: %s', error.message);
    return res.status(500).json({
      success: false,
      message: 'Internal server error during verification',
      error:
        process.env.NODE_ENV === 'development'
          ? error.message
          : 'Internal Server Error'
    });
  }
};

// Resend Ride Start OTP
exports.resendOtp = async (req, res) => {
  try {
    const query = { _id: req.params.id || req.params.rideId };
    if (req.user.role === 'driver') {
      query.driver = req.user._id;
    } else if (req.user.role === 'client') {
      query.client = req.user._id;
    } else {
      return res.status(403).json({ success: false, message: 'Unauthorized role.' });
    }

    const ride = await Ride.findOne(query);
    if (!ride) {
      return res.status(404).json({ success: false, message: 'Booking not found.' });
    }
    if (ride.status !== 'driver_assigned' && ride.status !== 'driver_arrived') {
      return res.status(400).json({
        success: false,
        message: 'OTP verification is not allowed at this stage.'
      });
    }
    if (
      ride.otpLastSentAt &&
      Date.now() - ride.otpLastSentAt.getTime() < 30000
    ) {
      return res.status(429).json({
        success: false,
        message: 'Please wait before requesting another OTP.'
      });
    }
    // Generate fresh secure 4-digit code
    const freshOtp = crypto.randomInt(1000, 10000).toString();

    ride.rideOtp = freshOtp;
    ride.rideOtpHash = await bcrypt.hash(freshOtp, 10);
    ride.otpAttempts = 0;
    ride.otpExpiresAt = new Date(Date.now() + 5 * 60 * 1000); // Reset for another 5 minutes
    ride.otpLastSentAt = new Date();
    await ride.save();

    await ride.populate('client', 'fullName email phone');
    await ride.populate('driver', 'fullName phone vehicleNumber vehicleType');

    // Notify dashboard countdowns in room in real-time (C-2)
    const io = req.app.get('io');
    if (io) {
      io.to(`ride_${ride._id}`).emit(`ride_status_${ride._id}`, {
        otpSent: true,
        otpExpiresAt: ride.otpExpiresAt
      });
    }

    // Dispatch email template asynchronously
    sendOtpEmail(ride, freshOtp, ride.driver ? ride.driver.fullName : 'Chauffeur')
      .then(sent => {
        if (!sent) {
          logger.warn(`[OTP RESEND] Email failed to send for ride ${ride._id}`);
        }
      })
      .catch(err => {
        logger.error(`[OTP RESEND] Error sending email for ride ${ride._id}: %s`, err.message);
      });

    return res.status(200).json({
      success: true,
      message: 'A fresh verification code has been dispatched to your email address.'
    });
  } catch (error) {
    logger.error('Error resending OTP: %s', error.message);
    return res.status(500).json({
      success: false,
      message: 'Failed to resend OTP',
      error:
        process.env.NODE_ENV === 'development'
          ? error.message
          : 'Internal Server Error'
    });
  }
};

// Complete an active ride booking
exports.completeRide = async (req, res) => {
  try {
    const ride = await Ride.findOne({ _id: req.params.id || req.params.rideId, driver: req.user._id });

    if (!ride) {
      return res.status(404).json({ success: false, message: 'Ride not found.' });
    }

    // Enforce OTP starting restrictions
    if (!ride.otpVerified || ride.status !== 'ride_started') {
      return res.status(400).json({
        success: false,
        message: 'Ride cannot be completed because the journey was never verified/started using OTP.'
      });
    }

    if (ride.paymentMethod === 'cash') {
      ride.paymentStatus = 'paid';
    }
    ride.status = 'completed';
    ride.completedAt = new Date();
    await ride.save();

    // Create a transaction ledger record if the payment was cash
    if (ride.paymentMethod === 'cash') {
      await Transaction.create({
        user: ride.client,
        ride: ride._id,
        amount: ride.fare,
        type: 'payment',
        paymentMethod: 'cash',
        status: 'success'
      });
    }

    // Invalidate dashboard stats cache
    cache.clearDashboardCache();

    // Broadcast complete status to room (C-2)
    const io = req.app.get('io');
    if (io) {
      io.to(`ride_${ride._id}`).emit(`ride_status_${ride._id}`, {
        status: 'completed',
        completedAt: ride.completedAt
      });
    }

    // Dispatch invoice email
    sendInvoiceEmail(ride).catch(err => logger.error('Failed to send invoice email: %s', err.message));

    return res.status(200).json({
      success: true,
      message: 'Ride completed successfully. Invoice dispatched.',
      ride
    });
  } catch (error) {
    logger.error('Error completing ride: %s', error.message);
    return res.status(500).json({
      success: false,
      message: 'Failed to complete ride',
      error:
        process.env.NODE_ENV === 'development'
          ? error.message
          : 'Internal Server Error'
    });
  }
};

// Rate and review a completed ride booking
exports.rateRide = async (req, res) => {
  try {
    const { rating, feedback } = req.body;

    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({ success: false, message: 'Please provide a valid rating between 1 and 5.' });
    }

    const ride = await Ride.findOne({ _id: req.params.id || req.params.rideId, client: req.user._id });

    if (!ride) {
      return res.status(404).json({ success: false, message: 'Ride booking not found.' });
    }

    if (ride.status !== 'completed') {
      return res.status(400).json({ success: false, message: 'You can only rate completed rides.' });
    }

    if (ride.rating) {
      return res.status(400).json({ success: false, message: 'You have already rated this ride.' });
    }

    ride.rating = rating;
    ride.feedback = feedback || '';
    await ride.save();

    // Update driver's overall rating (Phase 5)
    if (ride.driver) {
      const driverId = ride.driver;
      // Get all completed rides with ratings for this driver
      const driverRides = await Ride.find({ driver: driverId, rating: { $exists: true } }).select('rating');
      const totalRatings = driverRides.length;
      const sumRatings = driverRides.reduce((sum, r) => sum + r.rating, 0);
      const averageRating = totalRatings > 0 ? Number((sumRatings / totalRatings).toFixed(2)) : 0;

      await User.findByIdAndUpdate(driverId, {
        totalRatings,
        averageRating
      });
      logger.info(`[RATING UPDATE] Chauffeur ${driverId} overall stats updated: averageRating=${averageRating}, totalRatings=${totalRatings}`);
    }

    // Broadcast rating/feedback update to room in real-time (C-2)
    const io = req.app.get('io');
    if (io) {
      io.to(`ride_${ride._id}`).emit(`ride_status_${ride._id}`, {
        rating: ride.rating,
        feedback: ride.feedback
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Thank you for your rating and feedback!',
      ride
    });
  } catch (error) {
    logger.error('Error rating ride: %s', error.message);
    return res.status(500).json({
      success: false,
      message: 'Failed to rate ride',
      error:
        process.env.NODE_ENV === 'development'
          ? error.message
          : 'Internal Server Error'
    });
  }
};

// Cancel an active ride booking (handles both driver and client cancellation with refunds)
exports.cancelRide = async (req, res) => {
  try {
    const ride = await Ride.findById(req.params.id || req.params.rideId);

    if (!ride) {
      return res.status(404).json({ success: false, message: 'Ride not found' });
    }

    // Check ownership/permissions
    if (req.user.role === 'client') {
      if (ride.client.toString() !== req.user._id.toString()) {
        return res.status(403).json({ success: false, message: 'Forbidden: You do not own this ride booking' });
      }
      // Clients can cancel pending or driver_assigned
      const allowedClientStatuses = ['pending', 'driver_assigned'];
      if (!allowedClientStatuses.includes(ride.status)) {
        return res.status(400).json({
          success: false,
          message: `Cannot cancel a ride with status: ${ride.status}`
        });
      }
    } else if (req.user.role === 'driver') {
      if (!ride.driver || ride.driver.toString() !== req.user._id.toString()) {
        return res.status(403).json({ success: false, message: 'Forbidden: You are not the chauffeur assigned to this ride' });
      }
      // Drivers can cancel driver_assigned or driver_arrived
      const allowedDriverStatuses = ['driver_assigned', 'driver_arrived'];
      if (!allowedDriverStatuses.includes(ride.status)) {
        return res.status(400).json({
          success: false,
          message: `Cannot cancel a ride with status: ${ride.status}`
        });
      }
    } else if (req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Unauthorized role.' });
    }

    // Handle online payment refund (Phase 5)
    let refundSuccessful = false;
    let refundId = null;

    if (ride.paymentStatus === 'paid' && ride.razorpayPaymentId) {
      if (razorpay) {
        try {
          const refundResponse = await razorpay.payments.refund(ride.razorpayPaymentId, {
            amount: ride.fare * 100, // Razorpay amount in paise
            notes: {
              rideId: ride._id.toString(),
              reason: `Ride cancelled by ${req.user.role} (${req.user.fullName})`
            }
          });
          refundSuccessful = true;
          refundId = refundResponse.id;
          
          // Create a transaction ledger record for the refund
          await Transaction.create({
            user: ride.client,
            ride: ride._id,
            amount: ride.fare,
            type: 'refund',
            paymentMethod: ride.paymentMethod || 'card',
            razorpayPaymentId: ride.razorpayPaymentId,
            status: 'success'
          });
          
          ride.paymentStatus = 'refunded';
          logger.info(`[REFUND SUCCESS] Razorpay refund issued for ride ${ride._id}. Refund ID: ${refundId}`);
        } catch (refundError) {
          logger.error(`[REFUND ERROR] Razorpay refund failed for ride ${ride._id}: %s`, refundError.message);
          // Do not block the cancellation if refund fails, but log it
        }
      } else {
        logger.warn(`[REFUND SKIPPED] Razorpay client not configured; refund skipped for ride ${ride._id}`);
      }
    }

    ride.status = 'cancelled';
    await ride.save();

    // Invalidate dashboard stats cache
    cache.clearDashboardCache();

    // Broadcast that the ride is cancelled
    const io = req.app.get('io');
    if (io) {
      io.emit('ride-cancelled', {
        rideId: ride._id,
        cancelledBy: req.user._id,
        role: req.user.role
      });
      io.to(`ride_${ride._id}`).emit(`ride_status_${ride._id}`, {
        status: 'cancelled',
        paymentStatus: ride.paymentStatus
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Ride cancelled successfully' + (ride.paymentStatus === 'refunded' ? ' and refund processed.' : '.'),
      ride,
    });
  } catch (error) {
    logger.error('Error cancelling ride: %s', error.message);
    return res.status(500).json({
      success: false,
      message: 'Failed to cancel ride',
      error:
        process.env.NODE_ENV === 'development'
          ? error.message
          : 'Internal Server Error'
    });
  }
};

// Get all active rides or past rides depending on role (supports backward-compatible pagination)
exports.getRides = async (req, res) => {
  try {
    let query = {};
    if (req.user.role === 'client') {
      query.client = req.user._id;
    } else if (req.user.role === 'driver') {
      // Drivers can see pending rides or rides assigned to them.
      // If it's an online payment (card/upi), they can ONLY see it if it's already paid!
      query = {
        $or: [
          {
            status: 'pending',
            $or: [
              { paymentMethod: 'cash' },
              { paymentMethod: { $in: ['card', 'upi'] }, paymentStatus: 'paid' }
            ]
          },
          { driver: req.user._id }
        ]
      };
    }

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 100; // default 100 for backward compatibility
    const skip = (page - 1) * limit;

    const total = await Ride.countDocuments(query);
    let rideQuery = Ride.find(query);
    if (req.user.role === 'client') {
      rideQuery = rideQuery.select('+rideOtp');
    }
    const rides = await rideQuery
      .populate('client', 'fullName email phone')
      .populate('driver', 'fullName phone vehicleNumber vehicleType')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    return res.status(200).json({ 
      success: true, 
      count: rides.length,
      total,
      page,
      pages: Math.ceil(total / limit),
      rides 
    });
  } catch (error) {
    logger.error('Error fetching rides: %s', error.message);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch rides',
      error:
        process.env.NODE_ENV === 'development'
          ? error.message
          : 'Internal Server Error'
    });
  }
};

// Get a single ride by ID (ownership is enforced by ownershipMiddleware)
exports.getRideById = async (req, res) => {
  try {
    let rideQuery = Ride.findById(req.params.id || req.params.rideId);
    if (req.user.role === 'client') {
      rideQuery = rideQuery.select('+rideOtp');
    }
    const ride = await rideQuery
      .populate('client', 'fullName email phone')
      .populate('driver', 'fullName phone vehicleNumber vehicleType');

    if (!ride) {
      return res.status(404).json({ success: false, message: 'Ride booking not found.' });
    }

    // IDOR protection: verify ownership based on role
    if (req.user.role === 'client' && ride.client._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Forbidden: You do not own this ride booking' });
    }
    if (req.user.role === 'driver') {
      const isAssigned = ride.driver && ride.driver._id.toString() === req.user._id.toString();
      const isPending = ride.status === 'pending';
      if (!isAssigned && !isPending) {
        return res.status(403).json({ success: false, message: 'Forbidden: You are not assigned to this ride booking' });
      }
    }

    return res.status(200).json({ success: true, ride });
  } catch (error) {
    logger.error('Error fetching ride by ID: %s', error.message);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch ride details',
      error:
        process.env.NODE_ENV === 'development'
          ? error.message
          : 'Internal Server Error'
    });
  }
};

// Delete a pending ride booking (client only, must own the ride)
exports.deleteRide = async (req, res) => {
  try {
    const ride = await Ride.findOne({
      _id: req.params.id || req.params.rideId,
      client: req.user._id,
    });

    if (!ride) {
      return res.status(404).json({ success: false, message: 'Ride booking not found or you do not have permission to delete it.' });
    }

    if (ride.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: `Cannot delete a ride that is already ${ride.status}. Only pending rides can be deleted.`
      });
    }

    await Ride.findByIdAndDelete(ride._id);

    // Invalidate dashboard stats cache
    cache.clearDashboardCache();

    // Broadcast deletion event
    const io = req.app.get('io');
    if (io) {
      io.emit('ride-deleted', { rideId: ride._id });
    }

    return res.status(200).json({ success: true, message: 'Ride booking deleted successfully.' });
  } catch (error) {
    logger.error('Error deleting ride: %s', error.message);
    return res.status(500).json({
      success: false,
      message: 'Failed to delete ride booking',
      error:
        process.env.NODE_ENV === 'development'
          ? error.message
          : 'Internal Server Error'
    });
  }
};
