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



const app = express();

const haltOnTimedout = (req, res, next) => {
    if (!req.timedout) next();
};

app.disable('x-powered-by');

// Trust Proxy Enabled for Production Rate Limiting Accuracy (Nginx, AWS ALB, Cloudflare support)
app.set('trust proxy', 1);

// Security Middlewares
// app.use(helmet());
app.use(
    helmet({
        crossOriginResourcePolicy: {
            policy: 'cross-origin',
        },
    })
);
app.use(
    cors({
        origin: (origin, callback) => {
            // Allow requests with no origin (like mobile apps or curl requests)
            if (!origin) return callback(null, true);

            const list = process.env.CLIENT_URL
                ? process.env.CLIENT_URL.split(',').map(url => url.trim())
                : ['http://localhost:5173', 'http://localhost:4173'];

            const isAllowed = list.some(allowed => origin === allowed) ||
                origin.endsWith('.vercel.app') ||
                process.env.NODE_ENV === 'development';

            if (isAllowed) {
                callback(null, true);
            } else {
                callback(null, false);
            }
        },
        credentials: true,
        methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
    })
);
app.use(globalLimiter);
app.use(express.json({ limit: '10mb' }));
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
app.use(hpp());
app.use(compression());
app.use(cookieParser());

app.use(timeout('15s'));
app.use(haltOnTimedout);

if (process.env.NODE_ENV === 'production') {
    // Use 'combined' for production: outputs structured, single-line Apache-style logs
    app.use(morgan('combined'));
} else {
    // Use 'dev' only for local development
    app.use(morgan('dev'));
}

// Import specific rate limiters for app-level routes
const { driverLocationLimiter, paymentLimiter } = require('./middlewares/rateLimiters');

// Routes
app.use('/api/v1/auth', haltOnTimedout, require('./routes/authRoutes'));
app.use('/api/v1/admin', haltOnTimedout, require('./routes/adminRoutes'));
app.use('/api/v1/rides', haltOnTimedout, require('./routes/rideRoutes'));

// Secured Enterprise API Routes (RBAC + Input Validation + IDOR Protection)
app.use('/api', haltOnTimedout, require('./routes/apiRoutes'));

// Driver Location & Payment API Stubs protected by their respective route-specific limiters
app.post('/api/v1/drivers/location', driverLocationLimiter, (req, res) => {
    res.status(200).json({ success: true, message: 'Driver location updated successfully (Stub)' });
});

app.use('/api/v1/payment', paymentLimiter, haltOnTimedout, require('./routes/paymentRoutes'));

// Basic route
app.get('/', (req, res) => {
    res.send('DMS Cab Services API is running');
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
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(err.status || 500).json({
        success: false,
        message:
            process.env.NODE_ENV === 'development'
                ? err.message
                : 'Internal Server Error',
    });
});

module.exports = app;
