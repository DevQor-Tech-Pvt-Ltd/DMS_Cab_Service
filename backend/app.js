const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const cookieParser = require('cookie-parser');
const path = require('path');

const app = express();

// Trust Proxy Enabled for Production Rate Limiting Accuracy (Nginx, AWS ALB, Cloudflare support)
app.set('trust proxy', 1);

// Security Middlewares
// app.use(helmet());
app.use(
    helmet({
        crossOriginResourcePolicy: false,
    })
);
app.use(
    cors({
        origin: [process.env.CLIENT_URL || 'http://localhost:5173', 'http://localhost:4173'],
        credentials: true,
        methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
    })
);
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));
app.use(cookieParser());
app.use(morgan('dev'));

// Import specific rate limiters for app-level routes
const { driverLocationLimiter, paymentLimiter } = require('./middlewares/rateLimiters');

// Routes
app.use('/api/v1/auth', require('./routes/authRoutes'));
app.use('/api/v1/admin', require('./routes/adminRoutes'));
app.use('/api/v1/rides', require('./routes/rideRoutes'));

// Driver Location & Payment API Stubs protected by their respective route-specific limiters
app.post('/api/v1/drivers/location', driverLocationLimiter, (req, res) => {
    res.status(200).json({ success: true, message: 'Driver location updated successfully (Stub)' });
});

app.use('/api/v1/payment', paymentLimiter, require('./routes/paymentRoutes'));

// Basic route
app.get('/', (req, res) => {
    res.send('DMS Luxe API is running');
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(err.status || 500).json({
        success: false,
        error: err.message || 'Server Error'
    });
});

module.exports = app;
