const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { sendInquiryEmail, sendEmail, getEmailHealthStatus } = require('../utils/emailService');
const { uploadBase64Document } = require('../utils/cloudinary');
const logger = require('../utils/logger');
const { isDeployed, getCookieOptions } = require('../utils/env');

// Log cookie mode at startup for diagnostics
logger.info('Cookie config: isDeployed=%s, NODE_ENV=%s, RENDER=%s, CLIENT_URL=%s',
  isDeployed(),
  process.env.NODE_ENV || '(unset)',
  process.env.RENDER || '(unset)',
  process.env.CLIENT_URL ? '(set)' : '(unset)'
);

const createToken = (user) => {
  if (!process.env.JWT_SECRET) {
    throw new Error('JWT_SECRET environment variable is not configured. Server cannot issue tokens.');
  }
  return jwt.sign(
    {
      userId: user._id.toString(),
      id: user._id.toString(),
      email: user.email,
      role: user.role,
    },
    process.env.JWT_SECRET,
    {
      expiresIn: '15m',
    }
  );
};

const createRefreshToken = (user) => {
  if (!process.env.JWT_REFRESH_SECRET) {
    throw new Error('JWT_REFRESH_SECRET environment variable is not configured. Server cannot issue tokens.');
  }
  return jwt.sign(
    {
      userId: user._id.toString(),
      id: user._id.toString(),
      role: user.role,
    },
    process.env.JWT_REFRESH_SECRET,
    {
      expiresIn: '7d',
    }
  );
};

const sendToken = (res, user) => {
  const token = createToken(user);
  const refreshToken = createRefreshToken(user);
  const cookieOptions = getCookieOptions();
  logger.info('sendToken: Setting cookies with options: secure=%s, sameSite=%s, user=%s',
    cookieOptions.secure, cookieOptions.sameSite, user.email);

  res.cookie('token', token, { ...cookieOptions, maxAge: 15 * 60 * 1000 });
  res.cookie('refreshToken', refreshToken, { ...cookieOptions, maxAge: 7 * 24 * 60 * 60 * 1000 });

  res.status(200).json({
    success: true,
    user: user.toJSON ? user.toJSON() : user,
    role: user.role,
    token,
    refreshToken
  });
};

exports.register = async (req, res, next) => {
  try {
    const {
      fullName,
      email,
      phone,
      role,
      password,
      confirmPassword,
      vehicleNumber,
      licenseNumber,
      rcDocument,
      licenseDocument,
      aadhaarDocument,
      panDocument,
      currentCity,
      vehicleModelYear,
      aadhaarNumber,
      driverNameIfVendor,
      driverContactNumber,
      rcCopyAvailable,
      insuranceValidTill,
      preferredServiceArea,
      previousExperience
    } = req.body;

    // Validation
    if (!fullName || !email || !phone || !role || !password || !confirmPassword) {
      return res.status(400).json({ success: false, message: 'Please provide all required fields' });
    }

    if (password !== confirmPassword) {
      return res.status(400).json({ success: false, message: 'Passwords do not match' });
    }

    const isStrongPassword = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^a-zA-Z0-9])/.test(password);
    if (!isStrongPassword) {
      return res.status(400).json({ success: false, message: 'Password must contain at least 1 uppercase letter, 1 lowercase letter, 1 number, and 1 special character' });
    }

    // Only 'client' and 'driver' roles are allowed via public registration
    if (!['client', 'driver'].includes(role)) {
      return res.status(400).json({ success: false, message: 'Invalid role' });
    }

    // Check if email already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(409).json({ success: false, message: 'Email already in use' });
    }

    // Check if phone number already exists
    const existingPhone = await User.findOne({ phone });
    if (existingPhone) {
      return res.status(409).json({ success: false, message: 'Phone number already in use' });
    }

    // Prepare user data
    const userData = {
      fullName,
      email,
      phone,
      role,
      password
    };

    // If role is driver, set status to pending and require vehicle details
    if (role === 'driver') {
      if (
        !phone ||
        !currentCity ||
        !vehicleNumber ||
        !vehicleModelYear ||
        !licenseNumber ||
        !insuranceValidTill ||
        !preferredServiceArea ||
        !licenseDocument ||
        !rcDocument ||
        !aadhaarDocument ||
        !panDocument
      ) {
        return res.status(400).json({
          success: false,
          message: 'All driver details (Contact Number, Current City, Car Number, Vehicle Model & Year, Driving License Number, Insurance Valid Till, Preferred Service Area, License Document, RC Document, Aadhaar Document, and PAN Document) are required.'
        });
      }
      userData.vehicleNumber = vehicleNumber;
      userData.licenseNumber = licenseNumber;

      // Upload documents to Cloudinary to replace base64 strings with clean URLs
      userData.rcDocument = rcDocument ? await uploadBase64Document(rcDocument, 'dms_luxe_vehicle_rc') : null;
      userData.licenseDocument = licenseDocument ? await uploadBase64Document(licenseDocument, 'dms_luxe_driver_licenses') : null;
      userData.aadhaarDocument = aadhaarDocument ? await uploadBase64Document(aadhaarDocument, 'dms_luxe_driver_aadhaars') : null;
      userData.panDocument = panDocument ? await uploadBase64Document(panDocument, 'dms_luxe_driver_pans') : null;

      userData.currentCity = currentCity;
      userData.vehicleModelYear = vehicleModelYear;
      userData.aadhaarNumber = aadhaarNumber;
      userData.driverNameIfVendor = driverNameIfVendor;
      userData.driverContactNumber = driverContactNumber;
      userData.rcCopyAvailable = rcCopyAvailable || 'Yes';
      userData.insuranceValidTill = insuranceValidTill;
      userData.preferredServiceArea = preferredServiceArea;
      userData.previousExperience = previousExperience;
      userData.status = 'pending'; // Drivers need admin approval
      userData.isApproved = false;
    } else {
      // Clients are auto-approved
      userData.status = 'approved';
      userData.isApproved = true;
    }

    const user = await User.create(userData);

    // Structured audit log (Audit 13.1)
    logger.info('[USER_REGISTERED] userId=%s | email=%s | role=%s | IP=%s', user._id, user.email, user.role, req.ip);

    if (role === 'driver') {
      return res.status(201).json({
        success: true,
        message: 'Registration successful! Your account is pending admin approval.',
        user: user.toJSON(),
        approvalRequired: true
      });
    }

    sendToken(res, user);
  } catch (error) {
    logger.error('Register error: %s', error.message);
    next(error);
  }
};

exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Email and password are required' });
    }

    const user = await User.findOne({ email }).select('+password');
    if (!user || !(await user.matchPassword(password))) {
      logger.warn('[LOGIN_FAILED] email=%s | reason=invalid_credentials | IP=%s', email, req.ip);
      return res.status(401).json({ success: false, message: 'Invalid email or password' });
    }

    // Check if user is active
    if (user.isActive === false) {
      return res.status(403).json({ success: false, message: 'This account has been deactivated/deleted.' });
    }

    // Check if driver is approved
    if (user.role === 'driver' && user.status !== 'approved') {
      return res.status(403).json({
        success: false,
        message: 'Your account is pending admin approval. Please wait or contact support.',
        status: user.status
      });
    }

    logger.info('[LOGIN_SUCCESS] userId=%s | email=%s | role=%s | IP=%s', user._id, user.email, user.role, req.ip);
    sendToken(res, user);
  } catch (error) {
    logger.error('Login error: %s', error.message);
    return res.status(500).json({ success: false, message: 'Login failed. Please try again.' });
  }
};

exports.getMe = async (req, res, next) => {
  try {
    if (!req.user || !req.user._id) {
      logger.warn('getMe called without req.user._id context');
      return res.status(401).json({ success: false, message: 'Not authorized, missing session user' });
    }

    const user = await User.findById(req.user._id).populate('approvedBy', 'fullName email');
    if (!user) {
      logger.warn('getMe failed: user %s not found in database', req.user._id);
      return res.status(404).json({ success: false, message: 'User profile not found.' });
    }

    logger.info('getMe successful for user %s (role: %s)', user.email, user.role);
    return res.status(200).json({ success: true, user: user.toJSON() });
  } catch (error) {
    logger.error('GetMe controller error: %s', error.stack || error.message);
    return res.status(500).json({ success: false, message: 'Unable to fetch user profile.' });
  }
};

exports.logout = async (req, res, next) => {
  try {
    const token = req.cookies?.token || (req.headers.authorization && req.headers.authorization.startsWith('Bearer') ? req.headers.authorization.split(' ')[1] : null);
    const refreshToken = req.cookies?.refreshToken;

    const BlacklistedToken = require('../models/BlacklistedToken');

    const blacklistToken = async (t) => {
      if (!t) return;
      try {
        const decoded = jwt.decode(t);
        if (decoded && decoded.exp) {
          const expiresAt = new Date(decoded.exp * 1000);
          await BlacklistedToken.create({ token: t, expiresAt });
        }
      } catch (err) {
        logger.error('Failed to blacklist token: %s', err.message);
      }
    };

    await Promise.all([
      blacklistToken(token),
      blacklistToken(refreshToken)
    ]);

    const cookieOpts = getCookieOptions();
    res.cookie('token', '', {
      ...cookieOpts,
      expires: new Date(0),
    });
    res.cookie('refreshToken', '', {
      ...cookieOpts,
      expires: new Date(0),
    });

    res.status(200).json({ success: true, message: 'Logged out successfully' });
  } catch (error) {
    logger.error('Logout error: %s', error.message);
    return res.status(500).json({ success: false, message: 'Logout failed.' });
  }
};

exports.updateProfile = async (req, res, next) => {
  try {
    const {
      fullName,
      email,
      phone,
      currentPassword,
      newPassword,
      vehicleNumber,
      licenseNumber,
      rcDocument,
      licenseDocument,
      aadhaarDocument,
      panDocument,
      profilePicture,
      currentCity,
      vehicleModelYear,
      aadhaarNumber,
      driverNameIfVendor,
      driverContactNumber,
      rcCopyAvailable,
      insuranceValidTill,
      preferredServiceArea,
      previousExperience
    } = req.body;

    // Find the user (with password selected if they want to change it)
    const user = await User.findById(req.user._id).select('+password');
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // Validate email if it's being updated
    if (email && email !== user.email) {
      const emailExists = await User.findOne({ email });
      if (emailExists) {
        return res.status(409).json({ success: false, message: 'Email is already in use' });
      }
      user.email = email;
    }

    // Validate phone if it's being updated
    if (phone && phone !== user.phone) {
      const phoneExists = await User.findOne({ phone });
      if (phoneExists) {
        return res.status(409).json({ success: false, message: 'Phone number is already in use' });
      }
      user.phone = phone;
    }

    // Update standard fields
    if (fullName) user.fullName = fullName;
    if (profilePicture !== undefined) {
      user.profilePicture = profilePicture ? await uploadBase64Document(profilePicture, 'dms_luxe_profiles') : null;
    }

    // Update driver specific fields if the user is a driver
    if (user.role === 'driver') {
      if (vehicleNumber !== undefined) user.vehicleNumber = vehicleNumber;
      if (licenseNumber !== undefined) user.licenseNumber = licenseNumber;
      if (rcDocument !== undefined) {
        user.rcDocument = rcDocument ? await uploadBase64Document(rcDocument, 'dms_luxe_vehicle_rc') : null;
      }
      if (licenseDocument !== undefined) {
        user.licenseDocument = licenseDocument ? await uploadBase64Document(licenseDocument, 'dms_luxe_driver_licenses') : null;
      }
      if (aadhaarDocument !== undefined) {
        user.aadhaarDocument = aadhaarDocument ? await uploadBase64Document(aadhaarDocument, 'dms_luxe_driver_aadhaars') : null;
      }
      if (panDocument !== undefined) {
        user.panDocument = panDocument ? await uploadBase64Document(panDocument, 'dms_luxe_driver_pans') : null;
      }
      if (currentCity !== undefined) user.currentCity = currentCity;
      if (vehicleModelYear !== undefined) user.vehicleModelYear = vehicleModelYear;
      if (aadhaarNumber !== undefined) user.aadhaarNumber = aadhaarNumber;
      if (driverNameIfVendor !== undefined) user.driverNameIfVendor = driverNameIfVendor;
      if (driverContactNumber !== undefined) user.driverContactNumber = driverContactNumber;
      if (rcCopyAvailable !== undefined) user.rcCopyAvailable = rcCopyAvailable;
      if (insuranceValidTill !== undefined) user.insuranceValidTill = insuranceValidTill;
      if (preferredServiceArea !== undefined) user.preferredServiceArea = preferredServiceArea;
      if (previousExperience !== undefined) user.previousExperience = previousExperience;
    }

    // Password update handling
    if (newPassword) {
      if (!currentPassword) {
        return res.status(400).json({ success: false, message: 'Please provide current password to set a new password' });
      }
      const isMatch = await user.matchPassword(currentPassword);
      if (!isMatch) {
        return res.status(401).json({ success: false, message: 'Current password is incorrect' });
      }
      if (newPassword.length < 8) {
        return res.status(400).json({ success: false, message: 'New password must be at least 8 characters long' });
      }
      const isStrongPassword = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^a-zA-Z0-9])/.test(newPassword);
      if (!isStrongPassword) {
        return res.status(400).json({ success: false, message: 'New password must contain at least 1 uppercase letter, 1 lowercase letter, 1 number, and 1 special character' });
      }
      user.password = newPassword;
    }

    await user.save();

    // Remove password field before sending response
    const updatedUser = user.toJSON();

    return res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
      user: updatedUser,
    });
  } catch (error) {
    logger.error('Update profile error: %s', error.message);
    return res.status(500).json({ success: false, message: 'Profile update failed. Please try again.' });
  }
};

exports.contactInquiry = async (req, res, next) => {
  try {
    const { firstName, lastName, email, phone, subject, message } = req.body;

    if (!firstName || !lastName || !email || !subject || !message) {
      return res.status(400).json({ success: false, message: 'Please provide all required fields' });
    }

    // Send email asynchronously in the background so the response is returned immediately
    sendInquiryEmail({ firstName, lastName, email, phone, subject, message })
      .then(result => {
        if (!result.success) {
          logger.error('[Contact Inquiry] Asynchronous email delivery failed for: %s — code=%s, error=%s', email, result.code, result.error);
        } else {
          logger.info('[Contact Inquiry] Asynchronous email delivered successfully for: %s', email);
        }
      })
      .catch(err => {
        logger.error('[Contact Inquiry] Asynchronous email execution error for: %s — %s', email, err.message);
      });

    return res.status(200).json({ success: true, message: 'Inquiry sent successfully' });
  } catch (error) {
    logger.error('Contact inquiry controller error: %s', error.message);
    return res.status(500).json({ success: false, message: 'Failed to submit inquiry. Please try again.' });
  }
};

exports.deleteAccount = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    user.isActive = false;

    // Anonymize email and phone to release them for potential new registrations
    const timestamp = Date.now();
    user.email = `deactivated_${timestamp}_${user.email}`;
    user.phone = `deactivated_${timestamp}_${user.phone}`;

    await user.save();

    // Clear authentication cookies
    const cookieOpts = getCookieOptions();
    res.cookie('token', '', {
      ...cookieOpts,
      expires: new Date(0),
    });
    res.cookie('refreshToken', '', {
      ...cookieOpts,
      expires: new Date(0),
    });

    return res.status(200).json({
      success: true,
      message: 'Your account has been deleted successfully. You have been logged out.',
    });
  } catch (error) {
    logger.error('Delete account error: %s', error.message);
    return res.status(500).json({ success: false, message: 'Failed to delete account. Please try again.' });
  }
};

/**
 * Request Phone Verification OTP Code
 */
exports.sendPhoneOtp = async (req, res, next) => {
  try {
    const { phone } = req.body;
    if (!phone || !/^[+]?[\d\s\-().]{7,15}$/.test(phone)) {
      return res.status(400).json({ success: false, message: 'Please provide a valid phone number.' });
    }

    const crypto = require('crypto');
    const bcrypt = require('bcryptjs');
    const PhoneOtp = require('../models/PhoneOtp');
    const smsService = require('../services/smsService');

    // Generate secure 6-digit OTP
    const otp = crypto.randomInt(100000, 1000000).toString();
    const otpHash = await bcrypt.hash(otp, 10);
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes validity

    // Upsert verification record
    await PhoneOtp.findOneAndUpdate(
      { phone },
      { otpHash, expiresAt, attempts: 0, verified: false },
      { upsert: true, new: true }
    );

    // Send OTP via Email instead of SMS
    const user = await User.findOne({ phone });
    const recipientEmail = user ? user.email : (process.env.ADMIN_EMAIL || 'contact@dmscabservices.com');

    const htmlContent = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <title>Login Verification Code - DMS Cab Services</title>
        <style>
          body {
            font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
            background-color: #f8fafc;
            color: #0f172a;
            margin: 0;
            padding: 20px 0;
          }
          .container {
            max-width: 600px;
            margin: 20px auto;
            background-color: #ffffff;
            border: 1px solid rgba(0, 56, 147, 0.15);
            border-radius: 12px;
            overflow: hidden;
            box-shadow: 0 4px 20px rgba(0, 56, 147, 0.05);
          }
          .header {
            background-color: #003893;
            padding: 30px;
            text-align: center;
            border-bottom: 4px solid #F8C301;
          }
          .header h1 {
            color: #ffffff;
            font-family: 'Georgia', serif;
            letter-spacing: 4px;
            margin: 0;
            text-transform: uppercase;
            font-size: 24px;
          }
          .content {
            padding: 40px;
            line-height: 1.6;
          }
          .otp-box {
            background-color: #003893;
            border: 1px solid #002c6c;
            border-radius: 8px;
            padding: 20px;
            text-align: center;
            margin: 30px 0;
          }
          .otp-code {
            font-size: 38px;
            font-weight: bold;
            letter-spacing: 10px;
            color: #F8C301;
            margin: 0;
            font-family: monospace;
            text-shadow: 0 2px 4px rgba(0,0,0,0.2);
          }
          .footer {
            background-color: #0f172a;
            padding: 20px;
            text-align: center;
            font-size: 11px;
            color: #94a3b8;
            border-top: 1px solid rgba(0, 56, 147, 0.1);
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>DMS Cab Services</h1>
          </div>
          <div class="content">
            <h2 style="font-family: 'Georgia', serif; color: #003893; margin-top: 0; font-size: 20px;">Verification Code</h2>
            <p style="color: #475569; font-size: 14px;">
              Hello,<br><br>
              Use the verification code below to complete your login or registration for phone number <strong>${phone}</strong>.
            </p>
            
            <div class="otp-box">
              <p style="color: #94a3b8; font-size: 12px; text-transform: uppercase; margin: 0 0 10px; letter-spacing: 2px;">Verification Code</p>
              <h3 class="otp-code">${otp}</h3>
              <p style="color: #94a3b8; font-size: 11px; margin: 10px 0 0;">Valid for 5 minutes</p>
            </div>
            
            <p style="color: #64748b; font-size: 12px;">
              If you did not request this code, please ignore this email.
            </p>
          </div>
          <div class="footer">
            <p>DMS Cab Services | Kolkata, West Bengal</p>
          </div>
        </div>
      </body>
    </html>
    `;

    sendEmail({
      to: recipientEmail,
      subject: 'Login Verification Code - DMS Cab Services',
      html: htmlContent
    }).catch(err => logger.error(`[OTP Email Dispatch Error] to=${recipientEmail}: ${err.message}`));

    return res.status(200).json({
      success: true,
      message: 'OTP verification code sent successfully to email.'
    });
  } catch (error) {
    logger.error('Send phone OTP error: %s', error.message);
    return res.status(500).json({ success: false, message: 'Failed to dispatch verification code.' });
  }
};

/**
 * Verify OTP Code and Login/Register User
 */
exports.verifyPhoneOtp = async (req, res, next) => {
  try {
    const { phone, otp, role } = req.body;
    if (!phone || !otp) {
      return res.status(400).json({ success: false, message: 'Phone and verification code are required.' });
    }

    const bcrypt = require('bcryptjs');
    const PhoneOtp = require('../models/PhoneOtp');
    const User = require('../models/User');

    // Retrieve verification record
    const record = await PhoneOtp.findOne({ phone });
    if (!record) {
      return res.status(400).json({ success: false, message: 'Verification code has expired or is invalid.' });
    }

    // Attempt lockout protection
    if (record.attempts >= 3) {
      return res.status(400).json({ success: false, message: 'Too many verification failures. Please request a new OTP code.' });
    }

    // Increment attempts
    record.attempts += 1;
    await record.save();

    // Verify OTP code
    const isMatch = await bcrypt.compare(otp, record.otpHash);
    if (!isMatch) {
      return res.status(400).json({ success: false, message: 'Invalid verification code.' });
    }

    // Find user or register automatically (Uber/Ola style dynamic sign-up/sign-in)
    let user = await User.findOne({ phone });

    if (!user) {
      // Create user with sparse email placeholder
      const cleanPhone = phone.replace(/[^0-9]/g, '');
      const uniqueSuffix = Math.random().toString(36).substring(2, 6);
      const emailPlaceholder = `user_${cleanPhone}_${uniqueSuffix}@dms-luxe.com`;

      const selectRole = role && ['client', 'driver'].includes(role) ? role : 'client';

      user = await User.create({
        fullName: `User_${cleanPhone.slice(-4) || 'Luxe'}`,
        phone,
        email: emailPlaceholder,
        role: selectRole,
        status: selectRole === 'driver' ? 'pending' : 'approved',
        isApproved: selectRole === 'driver' ? false : true
      });
    }

    if (user.isActive === false) {
      return res.status(403).json({ success: false, message: 'This account has been deactivated/deleted.' });
    }

    // Check if driver is approved
    if (user.role === 'driver' && user.status !== 'approved') {
      return res.status(403).json({
        success: false,
        message: 'Your chauffeur account is pending admin approval.',
        status: user.status
      });
    }

    // OTP verified, remove record
    await PhoneOtp.deleteOne({ phone });

    // Issues session cookies and returns user details
    sendToken(res, user);
  } catch (error) {
    logger.error('Verify phone OTP error: %s', error.message);
    return res.status(500).json({ success: false, message: 'Verification failed. Please try again.' });
  }
};

/**
 * GET /api/v1/auth/email-health
 * Returns SMTP configuration health (never exposes passwords)
 */
exports.emailHealth = async (req, res) => {
  try {
    const status = getEmailHealthStatus();
    return res.status(200).json(status);
  } catch (error) {
    logger.error('Email health check error: %s', error.message);
    return res.status(500).json({ error: 'Failed to retrieve email health status.' });
  }
};

/**
 * GET /api/v1/auth/test-smtp-live
 * Performs real-time SMTP connection verification and returns diagnosis status
 */
exports.testSmtpLive = async (req, res) => {
  try {
    const dns = require('dns').promises;
    const net = require('net');

    // 1. Resolve DNS
    const dnsResults = {};
    try {
      dnsResults.ipv4 = await dns.resolve4('smtp.gmail.com');
    } catch (e) {
      dnsResults.ipv4Error = e.message;
    }
    try {
      dnsResults.ipv6 = await dns.resolve6('smtp.gmail.com');
    } catch (e) {
      dnsResults.ipv6Error = e.message;
    }
    try {
      dnsResults.lookup = await new Promise((resolve) => {
        require('dns').lookup('smtp.gmail.com', (err, address, family) => {
          resolve(err ? { error: err.message } : { address, family });
        });
      });
    } catch (e) {
      dnsResults.lookupError = e.message;
    }

    // Helper to test TCP port
    const testTcpPort = (host, port) => {
      return new Promise((resolve) => {
        const socket = new net.Socket();
        const startTime = Date.now();
        socket.setTimeout(3000);
        socket.on('connect', () => {
          socket.destroy();
          resolve({ connected: true, durationMs: Date.now() - startTime });
        });
        socket.on('timeout', () => {
          socket.destroy();
          resolve({ connected: false, error: 'timeout' });
        });
        socket.on('error', (err) => {
          socket.destroy();
          resolve({ connected: false, error: err.message });
        });
        socket.connect(port, host);
      });
    };

    // 2. Test TCP Ports
    const tcp465 = await testTcpPort('smtp.gmail.com', 465);
    const tcp587 = await testTcpPort('smtp.gmail.com', 587);

    // 3. Test Nodemailer verification
    const { testSmtpConnection } = require('../utils/emailService');
    const verification = await testSmtpConnection();

    if (req.timedout) return;

    const user = process.env.SMTP_USER || '';
    const maskedUser = user.length > 5 
      ? user.substring(0, 3) + '***' + user.substring(user.indexOf('@') - 2)
      : '***';

    return res.status(200).json({
      success: true,
      smtp: {
        host: process.env.SMTP_HOST || 'smtp.gmail.com',
        port: Number(process.env.SMTP_PORT) || 587,
        user: maskedUser,
        recipient: process.env.CONTACT_INQUIRY_RECIPIENT || user
      },
      dns: dnsResults,
      tcp: {
        port465: tcp465,
        port587: tcp587
      },
      verification
    });
  } catch (error) {
    if (req.timedout) return;
    logger.error('Test SMTP Live endpoint error: %s', error.message);
    return res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

