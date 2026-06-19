const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { sendInquiryEmail } = require('../utils/emailService');
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
    role: user.role 
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
        !rcCopyAvailable ||
        !insuranceValidTill ||
        !preferredServiceArea ||
        !licenseDocument ||
        (rcCopyAvailable === 'Yes' && !rcDocument)
      ) {
        return res.status(400).json({ 
          success: false, 
          message: 'All driver details (Contact Number, Current City, Car Number, Vehicle Model & Year, Driving License Number, RC Copy Available, Insurance Valid Till, Preferred Service Area, License Document, and RC Document if available) are required.' 
        });
      }
      userData.vehicleNumber = vehicleNumber;
      userData.licenseNumber = licenseNumber;
      
      // Upload documents to Cloudinary to replace base64 strings with clean URLs
      userData.rcDocument = rcDocument ? await uploadBase64Document(rcDocument, 'dms_luxe_vehicle_rc') : null;
      userData.licenseDocument = licenseDocument ? await uploadBase64Document(licenseDocument, 'dms_luxe_driver_licenses') : null;

      userData.currentCity = currentCity;
      userData.vehicleModelYear = vehicleModelYear;
      userData.aadhaarNumber = aadhaarNumber;
      userData.driverNameIfVendor = driverNameIfVendor;
      userData.driverContactNumber = driverContactNumber;
      userData.rcCopyAvailable = rcCopyAvailable;
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
    return res.status(500).json({ success: false, message: 'Registration failed. Please try again.' });
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

    // Update standard fields
    if (fullName) user.fullName = fullName;
    if (phone) user.phone = phone;
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

    const emailSent = await sendInquiryEmail({ firstName, lastName, email, phone, subject, message });
    
    if (emailSent) {
      return res.status(200).json({ success: true, message: 'Inquiry sent successfully' });
    } else {
      return res.status(500).json({ success: false, message: 'Failed to send inquiry email' });
    }
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
