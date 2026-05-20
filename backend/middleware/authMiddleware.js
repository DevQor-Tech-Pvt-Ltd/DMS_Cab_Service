const jwt = require('jsonwebtoken');
const User = require('../models/User');

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
      return res.status(401).json({ success: false, message: 'Not authorized, missing token' });
    }
    
    if (!process.env.JWT_SECRET) {
      throw new Error("JWT_SECRET is missing in environment variables");
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id);

    if (!user) {
      return res.status(401).json({ success: false, message: 'Not authorized, user not found' });
    }

    req.user = user;
    next();
  } catch (error) {
    console.error(error);
    return res.status(401).json({ success: false, message: 'Not authorized, invalid token' });
  }
};

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
