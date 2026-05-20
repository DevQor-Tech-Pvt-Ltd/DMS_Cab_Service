const Ride = require('../models/Ride');
const Razorpay = require('razorpay');
const { sendInvoiceEmail } = require('../utils/emailService');

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
      error: error.message,
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
    const otpExpiryTime = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes window

    // Atomically find the ride and update status to driver_assigned
    const ride = await Ride.findOneAndUpdate(
      { _id: req.params.id, status: 'pending' },
      { 
        driver: req.user._id, 
        status: 'driver_assigned',
        rideOtp: secureOtp,
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
        otpExpiresAt: ride.otpExpiresAt
      });
    }

    // Send Ride Start OTP via Nodemailer in background
    sendOtpEmail(ride, secureOtp, req.user.fullName).catch(err => 
      console.error('Failed to send Ride Start OTP email:', err)
    );

    return res.status(200).json({
      success: true,
      message: 'You have accepted the ride. Ride verification OTP has been emailed to the client.',
      ride,
    });
  } catch (error) {
    console.error('Error accepting ride:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to accept ride',
      error: error.message,
    });
  }
};

// Driver Arrived at client pickup location
exports.driverArrived = async (req, res) => {
  try {
    const ride = await Ride.findOne({ _id: req.params.id, driver: req.user._id });

    if (!ride) {
      return res.status(404).json({ success: false, message: 'Active booking not found for this chauffeur.' });
    }

    if (ride.status !== 'driver_assigned') {
      return res.status(400).json({ 
        success: false, 
        message: `Cannot trigger arrival because current status is: ${ride.status}` 
      });
    }

    ride.status = 'driver_arrived';
    await ride.save();

    // Broadcast real-time status change to the client
    const io = req.app.get('io');
    if (io) {
      io.emit(`ride_status_${ride._id}`, {
        status: 'driver_arrived'
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Status updated to Driver Arrived. Client has been notified.',
      ride
    });
  } catch (error) {
    console.error('Error in driverArrived:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to update chauffeur status',
      error: error.message
    });
  }
};

// Verify OTP to start the luxury ride
exports.verifyOtp = async (req, res) => {
  try {
    const { bookingId, otp } = req.body;
    const ipAddress = req.ip || req.headers['x-forwarded-for'] || 'unknown';

    if (!bookingId || !otp) {
      return res.status(400).json({ success: false, message: 'Booking ID and OTP code are required.' });
    }

    const ride = await Ride.findById(bookingId);
    if (!ride) {
      return res.status(404).json({ success: false, message: 'Booking not found.' });
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

    const isMatch = ride.rideOtp === otp.trim();

    // Create Audit Log record
    ride.otpAuditLogs.push({
      otpEntered: otp,
      success: isMatch,
      ipAddress
    });

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
      error: error.message
    });
  }
};

// Resend Ride Start OTP
exports.resendOtp = async (req, res) => {
  try {
    const crypto = require('crypto');
    const { sendOtpEmail } = require('../utils/emailService');

    const ride = await Ride.findById(req.params.id);
    if (!ride) {
      return res.status(404).json({ success: false, message: 'Booking not found.' });
    }

    // Generate fresh secure 4-digit code
    const freshOtp = crypto.randomInt(1000, 10000).toString();
    
    ride.rideOtp = freshOtp;
    ride.otpAttempts = 0;
    ride.otpExpiresAt = new Date(Date.now() + 15 * 60 * 1000); // Reset for another 15 minutes
    await ride.save();

    await ride.populate('client', 'fullName email phone');
    await ride.populate('driver', 'fullName phone vehicleNumber vehicleType');

    // Notify dashboard countdowns in real-time
    const io = req.app.get('io');
    if (io) {
      io.emit(`ride_status_${ride._id}`, {
        otpSent: true,
        otpExpiresAt: ride.otpExpiresAt
      });
    }

    // Dispatch email template asynchronously
    sendOtpEmail(ride, freshOtp, ride.driver ? ride.driver.fullName : 'Chauffeur').catch(err => 
      console.error('Failed to resend Ride Start OTP email:', err)
    );

    return res.status(200).json({
      success: true,
      message: 'A fresh verification code has been dispatched to your email address.'
    });
  } catch (error) {
    console.error('Error resending OTP:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to resend OTP',
      error: error.message
    });
  }
};

// Complete an active ride booking
exports.completeRide = async (req, res) => {
  try {
    const ride = await Ride.findOne({ _id: req.params.id, driver: req.user._id });

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
      error: error.message
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

    const ride = await Ride.findOne({ _id: req.params.id, client: req.user._id });

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
      error: error.message
    });
  }
};

// Cancel an active ride booking (driver cancelling the pickup)
exports.cancelRide = async (req, res) => {
  try {
    const ride = await Ride.findById(req.params.id);

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
      error: error.message,
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
      error: error.message,
    });
  }
};
