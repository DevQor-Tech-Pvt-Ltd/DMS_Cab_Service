const Ride = require('../models/Ride');
const Razorpay = require('razorpay');
const { sendInvoiceEmail } = require('../utils/emailService');
const bcrypt = require('bcryptjs');

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

    // Calculate a premium mock fare based on vehicle selection
    let baseFare = 1500;
    if (vehicleType?.toLowerCase().includes('mercedes')) baseFare = 3500;
    else if (vehicleType?.toLowerCase().includes('bmw')) baseFare = 3000;
    else if (vehicleType?.toLowerCase().includes('audi')) baseFare = 2800;
    else if (vehicleType?.toLowerCase().includes('suv')) baseFare = 2200;

    const isOnlinePayment = paymentMethod === 'card' || paymentMethod === 'upi';

    const ride = new Ride({
      client: req.user._id,
      pickupLocation,
      dropoffLocation,
      pickupDate,
      pickupTime,
      vehicleType,
      passengerDetails,
      paymentMethod: paymentMethod || 'cash',
      fare: baseFare,
      status: 'pending',
      paymentStatus: isOnlinePayment ? 'pending' : 'pending',
    });

    // If it's an online payment, generate a Razorpay order
    let razorpayOrder = null;
    if (isOnlinePayment) {
      if (!razorpay) {
        throw new Error('Razorpay integration is not configured on the server.');
      }
      
      const options = {
        amount: baseFare * 100, // in paise
        currency: 'INR',
        receipt: `receipt_${Date.now()}`,
      };

      razorpayOrder = await razorpay.orders.create(options);
      ride.razorpayOrderId = razorpayOrder.id;
    }

    await ride.save();

    // Only broadcast the socket event immediately if it's cash!
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
      
      // Dispatch invoice email to client asynchronously for cash bookings
      sendInvoiceEmail(ride).catch(err => console.error('Failed to send cash booking invoice email:', err));
    }

    return res.status(201).json({
      success: true,
      message: isOnlinePayment 
        ? 'Ride booked, payment order initiated' 
        : 'Ride booked successfully, notifying drivers',
      ride,
      razorpayOrder: razorpayOrder ? {
        id: razorpayOrder.id,
        amount: razorpayOrder.amount,
        currency: razorpayOrder.currency,
        key: process.env.RAZORPAY_KEY_ID
      } : null
    });
  } catch (error) {
    console.error('Error creating ride:', error);
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
    const crypto = require('crypto');
    const { sendOtpEmail } = require('../utils/emailService');

    // Securely generate a 4-digit OTP
    const secureOtp = crypto.randomInt(1000, 10000).toString();
    // Hash OTP before storing
    const hashedOtp = await bcrypt.hash(secureOtp, 10)
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

    // Broadcast that booking was accepted in real-time
    const io = req.app.get('io');
    if (io) {
      io.emit('booking-accepted', {
        rideId: ride._id,
        driverId: req.user._id,
        driverName: req.user.fullName,
      });

      // Emit client dashboard status change
      io.emit(`ride_status_${ride._id}`, {
        status: 'driver_assigned',
        driver: ride.driver,
        otpSent: true,
        otpExpiresAt: ride.otpExpiresAt,
        rideOtp: secureOtp
      });
    }

    // Send Ride Start OTP via Nodemailer asynchronously in the background
    sendOtpEmail(ride, secureOtp, req.user.fullName)
      .then(sent => {
        if (!sent) {
          console.warn(`[OTP] Email failed to send for ride ${ride._id}`);
        }
      })
      .catch(err => {
        console.error(`[OTP] Error sending email for ride ${ride._id}:`, err);
      });

    return res.status(200).json({
      success: true,
      message: 'You have accepted the ride. Ride verification OTP has been emailed to the client.',
      emailSent: true,
      ride,
    });
  } catch (error) {
    console.error('Error accepting ride:', error);
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
    const crypto = require('crypto');
    const { sendOtpEmail } = require('../utils/emailService');

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
    const otpExpiryTime = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes window

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

    // Broadcast real-time status change to the client
    const io = req.app.get('io');
    if (io) {
      io.emit(`ride_status_${ride._id}`, {
        status: 'driver_arrived',
        otpSent: true,
        otpExpiresAt: ride.otpExpiresAt,
        rideOtp: secureOtp
      });
    }

    // Dispatch email template to client asynchronously
    sendOtpEmail(ride, secureOtp, req.user.fullName)
      .then(sent => {
        if (!sent) {
          console.warn(`[OTP ARRIVAL] Email failed to send for ride ${ride._id}`);
        }
      })
      .catch(err => {
        console.error(`[OTP ARRIVAL] Error sending email for ride ${ride._id}:`, err);
      });

    return res.status(200).json({
      success: true,
      message: 'Status updated to Driver Arrived. Ride verification OTP has been emailed to the client.',
      emailSent: true,
      ride
    });
  } catch (error) {
    console.error('Error in driverArrived:', error);
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
    ride.rideOtp = null;
    ride.rideOtpHash = null;
    ride.otpExpiresAt = null;

    await ride.save();

    await ride.populate('client', 'fullName email phone');
    await ride.populate('driver', 'fullName phone vehicleNumber vehicleType');

    // Notify clients and general subscribers in real-time
    const io = req.app.get('io');
    if (io) {
      io.emit(`ride_status_${ride._id}`, {
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
    console.error('Error verifying OTP:', error);
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
    const crypto = require('crypto');
    const { sendOtpEmail } = require('../utils/emailService');

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

    // Notify dashboard countdowns in real-time
    const io = req.app.get('io');
    if (io) {
      io.emit(`ride_status_${ride._id}`, {
        otpSent: true,
        otpExpiresAt: ride.otpExpiresAt,
        rideOtp: freshOtp
      });
    }

    // Dispatch email template asynchronously
    sendOtpEmail(ride, freshOtp, ride.driver ? ride.driver.fullName : 'Chauffeur')
      .then(sent => {
        if (!sent) {
          console.warn(`[OTP RESEND] Email failed to send for ride ${ride._id}`);
        }
      })
      .catch(err => {
        console.error(`[OTP RESEND] Error sending email for ride ${ride._id}:`, err);
      });

    return res.status(200).json({
      success: true,
      message: 'A fresh verification code has been dispatched to your email address.'
    });
  } catch (error) {
    console.error('Error resending OTP:', error);
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

    ride.status = 'completed';
    ride.completedAt = new Date();
    await ride.save();

    // Broadcast complete status
    const io = req.app.get('io');
    if (io) {
      io.emit(`ride_status_${ride._id}`, {
        status: 'completed',
        completedAt: ride.completedAt
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Ride completed successfully. Invoice dispatched.',
      ride
    });
  } catch (error) {
    console.error('Error completing ride:', error);
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

    ride.rating = rating;
    ride.feedback = feedback || '';
    await ride.save();

    // Broadcast rating/feedback update in real-time
    const io = req.app.get('io');
    if (io) {
      io.emit(`ride_status_${ride._id}`, {
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
    console.error('Error rating ride:', error);
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

// Cancel an active ride booking (driver cancelling the pickup)
exports.cancelRide = async (req, res) => {
  try {
    const ride = await Ride.findOne({
      _id: req.params.id || req.params.rideId,
      driver: req.user._id
    });

    if (!ride) {
      return res.status(404).json({ success: false, message: 'Ride not found' });
    }

    // Update status to cancelled
    ride.status = 'cancelled';
    await ride.save();

    // Broadcast that the ride is cancelled
    const io = req.app.get('io');
    if (io) {
      io.emit('ride-cancelled', {
        rideId: ride._id,
        driverId: req.user._id,
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Ride cancelled successfully',
      ride,
    });
  } catch (error) {
    console.error('Error cancelling ride:', error);
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

// Get all active rides or past rides depending on role
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

    const rides = await Ride.find(query)
      .populate('client', 'fullName email phone')
      .populate('driver', 'fullName phone vehicleNumber vehicleType')
      .sort({ createdAt: -1 });

    return res.status(200).json({ success: true, rides });
  } catch (error) {
    console.error('Error fetching rides:', error);
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
    const ride = await Ride.findById(req.params.id || req.params.rideId)
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
    console.error('Error fetching ride by ID:', error);
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

    // Broadcast deletion event
    const io = req.app.get('io');
    if (io) {
      io.emit('ride-deleted', { rideId: ride._id });
    }

    return res.status(200).json({ success: true, message: 'Ride booking deleted successfully.' });
  } catch (error) {
    console.error('Error deleting ride:', error);
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
