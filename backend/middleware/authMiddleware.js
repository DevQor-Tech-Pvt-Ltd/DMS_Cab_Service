const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Ride = require('../models/Ride');
const logger = require('../utils/logger');

// Verify JWT and authenticate user with automatic token refresh support
exports.protect = async (req, res, next) => {
  try {
    let token = null;

    // Diagnostic: log what the server actually receives
    const hasCookieHeader = !!req.headers.cookie;
    const hasCookiesParsed = !!(req.cookies && Object.keys(req.cookies).length);
    const hasTokenCookie = !!(req.cookies && req.cookies.token);
    const hasRefreshCookie = !!(req.cookies && req.cookies.refreshToken);
    const hasAuthHeader = !!(req.headers.authorization);
    logger.info('Auth protect [%s %s]: cookieHeader=%s, parsedCookies=%s, tokenCookie=%s, refreshCookie=%s, authHeader=%s, origin=%s',
      req.method, req.originalUrl,
      hasCookieHeader, hasCookiesParsed, hasTokenCookie, hasRefreshCookie, hasAuthHeader,
      req.headers.origin || '(none)'
    );

    if (req.cookies && req.cookies.token) {
      token = req.cookies.token;
    }

    if (!token && req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      logger.warn('Auth protect: No token found, attempting refresh for %s %s', req.method, req.originalUrl);
      // If token is missing, attempt to refresh automatically using refresh token
      return handleRefresh(req, res, next);
    }

    // Check if token is blacklisted
    const BlacklistedToken = require('../models/BlacklistedToken');
    const isBlacklisted = await BlacklistedToken.exists({ token });
    if (isBlacklisted) {
      logger.warn('Auth protect: Token is blacklisted');
      return res.status(401).json({ success: false, message: 'Session expired, please login again' });
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
      logger.warn('Auth protect: JWT verify failed: %s', jwtError.message);
      // If Access Token is expired/invalid, try silent automatic refresh
      return handleRefresh(req, res, next, jwtError);
    }
  } catch (error) {
    logger.error('Auth protect middleware error: %s', error.message);
    return res.status(401).json({ success: false, message: 'Not authorized, token validation failed' });
  }
};

// Helper function to handle automatic access token regeneration using refresh token
async function handleRefresh(req, res, next, originalError = null) {
  try {
    let refreshToken = req.cookies?.refreshToken;
    if (!refreshToken && req.headers['x-refresh-token']) {
      refreshToken = req.headers['x-refresh-token'];
    }

    if (!refreshToken) {
      const message = originalError ? 'Session expired, please login again' : 'Not authorized, missing token';
      return res.status(401).json({ success: false, message });
    }

    // Check if refresh token is blacklisted
    const BlacklistedToken = require('../models/BlacklistedToken');
    const isRefreshBlacklisted = await BlacklistedToken.exists({ token: refreshToken });
    if (isRefreshBlacklisted) {
      logger.warn('Auth refresh: Refresh token is blacklisted');
      return res.status(401).json({ success: false, message: 'Session expired, please login again' });
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

    const { isDeployed } = require('../utils/env');
    res.cookie('token', newAccessToken, {
      httpOnly: true,
      secure: isDeployed(),
      sameSite: isDeployed() ? 'none' : 'lax',
      path: '/',
      maxAge: 15 * 60 * 1000,
    });

    // Expose the new access token via header for cross-site cookie-blocked clients
    res.setHeader('x-access-token', newAccessToken);

    req.user = user;
    return next();
  } catch (refreshError) {
    logger.error('Automatic token refresh failed: %s', refreshError.message);
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
    logger.error('Authorization check failed: %s', error.message);
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
