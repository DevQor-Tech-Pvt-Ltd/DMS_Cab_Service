const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Ride = require('../models/Ride');

// Verify JWT and authenticate user with automatic token refresh support
exports.protect = async (req, res, next) => {
  try {
    let token = null;

    if (req.cookies && req.cookies.token) {
      token = req.cookies.token;
    }

    if (!token && req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      // If token is missing, attempt to refresh automatically using refresh token
      return handleRefresh(req, res, next);
    }
    
    if (!process.env.JWT_SECRET) {
      throw new Error("JWT_SECRET is missing in environment variables");
    }

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.userId || decoded.id);

      if (!user) {
        return res.status(401).json({ success: false, message: 'Not authorized, user not found' });
      }

      if (user.isActive === false) {
        return res.status(403).json({ success: false, message: 'This account has been deactivated/deleted.' });
      }

      req.user = user;
      return next();
    } catch (jwtError) {
      // If Access Token is expired/invalid, try silent automatic refresh
      return handleRefresh(req, res, next, jwtError);
    }
  } catch (error) {
    console.error('Auth protect middleware error:', error);
    return res.status(401).json({ success: false, message: 'Not authorized, token validation failed' });
  }
};

// Helper function to handle automatic access token regeneration using refresh token
async function handleRefresh(req, res, next, originalError = null) {
  try {
    const refreshToken = req.cookies?.refreshToken;
    if (!refreshToken) {
      const message = originalError ? 'Session expired, please login again' : 'Not authorized, missing token';
      return res.status(401).json({ success: false, message });
    }

    if (!process.env.JWT_REFRESH_SECRET) {
      throw new Error("JWT_REFRESH_SECRET is missing in environment variables");
    }

    const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
    const user = await User.findById(decoded.userId || decoded.id);

    if (!user) {
      return res.status(401).json({ success: false, message: 'Not authorized, user not found' });
    }

    if (user.isActive === false) {
      return res.status(403).json({ success: false, message: 'This account has been deactivated/deleted.' });
    }

    // Generate new Access Token
    const newAccessToken = jwt.sign(
      {
        userId: user._id.toString(),
        id: user._id.toString(),
        email: user.email,
        role: user.role,
      },
      process.env.JWT_SECRET,
      { expiresIn: '15m' }
    );

    const isProduction = process.env.NODE_ENV === 'production';
    res.cookie('token', newAccessToken, {
      httpOnly: true,
      secure: isProduction,
      sameSite: isProduction ? 'none' : 'lax',
      path: '/',
      maxAge: 15 * 60 * 1000,
    });

    req.user = user;
    return next();
  } catch (refreshError) {
    console.error('Automatic token refresh failed:', refreshError.message);
    return res.status(401).json({ success: false, message: 'Session expired, please login again' });
  }
}

// Middleware to authorize specific roles
exports.authorize = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ 
        success: false, 
        message: `Only ${roles.join(', ')} can access this resource` 
      });
    }
    next();
  };
};

// Middleware to check if user (driver) is approved
exports.isApproved = async (req, res, next) => {
  try {
    if (req.user.role === 'driver' && req.user.status !== 'approved') {
      return res.status(403).json({ 
        success: false, 
        message: 'Your account is pending admin approval',
        status: req.user.status 
      });
    }
    next();
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, message: 'Authorization error' });
  }
};

// Middleware to verify ride ownership and prevent IDOR attacks
exports.ownershipMiddleware = async (req, res, next) => {
  try {
    const rideId = req.params.id || req.params.rideId || req.body.bookingId;
    if (!rideId) {
      return next(); // Skip if no ride ID is in request context
    }

    // Basic length check for ID to prevent casting error
    if (rideId.length !== 24 && !/^[0-9a-fA-F]{24}$/.test(rideId)) {
      return res.status(400).json({ success: false, message: 'Invalid Ride ID format' });
    }

    const ride = await Ride.findById(rideId);
    if (!ride) {
      return res.status(404).json({ success: false, message: 'Ride booking not found' });
    }

    // Admins bypass ownership check
    if (req.user.role === 'admin') {
      req.ride = ride;
      return next();
    }

    // Client role verification
    if (req.user.role === 'client') {
      if (ride.client.toString() !== req.user._id.toString()) {
        return res.status(403).json({ success: false, message: 'Forbidden: You do not own this ride booking' });
      }
    }

    // Driver role verification
    if (req.user.role === 'driver') {
      const isPending = ride.status === 'pending';
      const isAssigned = ride.driver && ride.driver.toString() === req.user._id.toString();
      
      // Driver can only see pending rides or rides explicitly assigned to them
      if (!isPending && !isAssigned) {
        return res.status(403).json({ success: false, message: 'Forbidden: You are not assigned to this ride booking' });
      }
    }

    req.ride = ride;
    next();
  } catch (error) {
    console.error('Ownership validation error:', error);
    return res.status(500).json({ success: false, message: 'Server error during ownership verification' });
  }
};

// Aliases for enterprise security standard compatibility
exports.authMiddleware = exports.protect;
exports.roleMiddleware = exports.authorize;
