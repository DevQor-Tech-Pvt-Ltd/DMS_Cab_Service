const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const cookieParser = require('cookie-parser');
const mongoSanitize = require('express-mongo-sanitize');
const hpp = require('hpp');
const compression = require('compression');
const timeout = require('connect-timeout');
const globalLimiter = require('./middleware/globalRateLimiter');
const { isOriginAllowed } = require('./utils/corsOriginValidator');
const securitySanitizer = require('./middleware/securitySanitizer');



const app = express();

const haltOnTimedout = (req, res, next) => {
    if (!req.timedout) next();
};

app.disable('x-powered-by');

// Trust Proxy Enabled for Production Rate Limiting Accuracy (Nginx, AWS ALB, Cloudflare support)
app.set('trust proxy', 1);

// Security Middlewares
app.use(
    helmet({
        crossOriginResourcePolicy: {
            policy: 'cross-origin',
        },
        contentSecurityPolicy: {
            directives: {
                defaultSrc: ["'self'"],
                scriptSrc: ["'self'", "'unsafe-inline'", "https://checkout.razorpay.com"],
                styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com", "https://unpkg.com"],
                imgSrc: ["'self'", "data:", "https://res.cloudinary.com", "https://images.unsplash.com", "https://*.tile.openstreetmap.org"],
                connectSrc: ["'self'", "https://api.razorpay.com", "https://lumberjack.razorpay.com", "wss://*.onrender.com", "ws://localhost:*", "http://localhost:*"],
                frameSrc: ["'self'", "https://api.razorpay.com", "https://checkout.razorpay.com"],
                fontSrc: ["'self'", "https://fonts.gstatic.com"],
                objectSrc: ["'none'"],
                mediaSrc: ["'self'"],
                upgradeInsecureRequests: [],
            },
        },
    })
);
app.use(
    cors({
        origin: (origin, callback) => {
            if (isOriginAllowed(origin)) {
                callback(null, true);
            } else {
                callback(null, false);
            }
        },
        credentials: true,
        methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
        exposedHeaders: ['x-access-token', 'x-refresh-token']
    })
);
app.use(globalLimiter);
app.use(
    express.json({
        limit: '10mb',
        verify: (req, res, buf, encoding) => {
            if (req.originalUrl && req.originalUrl.includes('/webhook')) {
                req.rawBody = buf.toString(encoding || 'utf8');
            }
        }
    })
);

// API response envelope decorator middleware
app.use((req, res, next) => {
  const originalJson = res.json;
  res.json = function (data) {
    if (data && typeof data === 'object') {
      if (data.success === false || data.success === true) {
        if (!data.hasOwnProperty('errors')) {
          data.errors = [];
        }
      }
    }
    return originalJson.call(this, data);
  };
  next();
});
app.use(express.urlencoded({ limit: '10mb', extended: true }));

// Express 5 req.query read-only bypass for express-mongo-sanitize & hpp compatibility
app.use((req, res, next) => {
    Object.defineProperty(req, 'query', {
        value: { ...req.query },
        writable: true,
        configurable: true,
        enumerable: true,
    });
    next();
});

app.use(mongoSanitize());
app.use(securitySanitizer);
app.use(hpp());
app.use(compression());
app.use(cookieParser());
app.use(require('./middleware/csrfMiddleware'));

const requestTimeoutVal = process.env.REQUEST_TIMEOUT || '15s';
app.use(timeout(requestTimeoutVal));
app.use(haltOnTimedout);

if (process.env.NODE_ENV === 'production') {
    // Use 'combined' for production: outputs structured, single-line Apache-style logs
    app.use(morgan('combined'));
} else {
    // Use 'dev' only for local development
    app.use(morgan('dev'));
}

// Import specific rate limiters for app-level routes
const { driverLocationLimiter, paymentLimiter } = require('./middleware/rateLimiters');

// Routes
app.use('/api/v1/auth', haltOnTimedout, require('./routes/authRoutes'));
app.use('/api/v1/admin', haltOnTimedout, require('./routes/adminRoutes'));
app.use('/api/v1/rides', haltOnTimedout, require('./routes/rideRoutes'));

// Driver Location API protected by auth middleware and rate limiter
const { protect, authorize } = require('./middleware/authMiddleware');
const User = require('./models/User');

app.post('/api/v1/drivers/location', protect, authorize('driver'), driverLocationLimiter, async (req, res, next) => {
  try {
    const { latitude, longitude } = req.body;
    if (latitude === undefined || longitude === undefined) {
      return res.status(400).json({ success: false, message: 'Latitude and longitude are required' });
    }

    await User.findByIdAndUpdate(req.user._id, {
      currentLocation: {
        latitude: Number(latitude),
        longitude: Number(longitude),
        lastUpdated: new Date()
      }
    });

    res.status(200).json({ success: true, message: 'Chauffeur location updated successfully' });
  } catch (error) {
    next(error);
  }
});

// GET Available Drivers - returns active approved drivers with location updated in last 5 minutes (Audit 9.1)
app.get('/api/v1/drivers/available', protect, async (req, res, next) => {
  try {
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
    const availableDrivers = await User.find({
      role: 'driver',
      status: 'approved',
      isActive: true,
      'currentLocation.lastUpdated': { $gte: fiveMinutesAgo }
    }).select('fullName vehicleType vehicleNumber currentLocation averageRating');

    res.status(200).json({
      success: true,
      count: availableDrivers.length,
      drivers: availableDrivers
    });
  } catch (error) {
    next(error);
  }
});


app.use('/api/v1/payment', paymentLimiter, haltOnTimedout, require('./routes/paymentRoutes'));

// Basic route - Minimal response to avoid server info disclosure (L-3)
app.get('/', (req, res) => {
    res.sendStatus(204);
});

// Health check endpoint for load balancer and monitoring probes (legacy and standard API)
app.get('/health', (req, res) => {
    res.status(200).json({
        status: 'ok',
        uptime: Math.floor(process.uptime()),
        timestamp: new Date().toISOString(),
    });
});

app.get('/api/health', (req, res) => {
    const mongoose = require('mongoose');
    const dbStateNum = mongoose.connection.readyState;
    const dbStates = {
        0: 'disconnected',
        1: 'connected',
        2: 'connecting',
        3: 'disconnecting'
    };
    const dbState = dbStates[dbStateNum] || 'unknown';
    const isHealthy = dbStateNum === 1;

    res.status(isHealthy ? 200 : 503).json({
        status: isHealthy ? 'ok' : 'degraded',
        database: dbState,
        uptime: Math.floor(process.uptime()),
        timestamp: new Date().toISOString(),
        memoryUsage: process.memoryUsage(),
        env: process.env.NODE_ENV || 'development'
    });
});

app.get('/api/v1', (req, res) => {
    res.status(200).json({ success: true, message: 'DMS Cab Services API v1 is running' });
});

app.use((err, req, res, next) => {
    if (err && err.timeout) {
        return res.status(503).json({
            success: false,
            message: 'Request timeout. Please try again later.',
        });
    }

    next(err);
});

// Error handling middleware
app.use(require('./middleware/errorMiddleware'));

module.exports = app;
