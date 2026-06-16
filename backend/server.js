require('dotenv').config();
const http = require('http');
const mongoose = require('mongoose');
const { Server } = require('socket.io');
const app = require('./app');
const connectDB = require('./config/db');
const createAdmin = require("./config/createAdmin");
const logger = require('./utils/logger');
const { isOriginAllowed } = require('./utils/corsOriginValidator');

// Connect to Database and start server
const startServer = async () => {
  await connectDB();
  await createAdmin();

  const server = http.createServer(app);

  // Setup Socket.IO
  const io = new Server(server, {
    cors: {
      origin: (origin, callback) => {
        if (isOriginAllowed(origin)) {
          callback(null, true);
        } else {
          callback(new Error('Not allowed by CORS'));
        }
      },
      methods: ['GET', 'POST'],
      credentials: true,
    },
  });

  // Socket.IO authentication middleware (H-6)
  const jwt = require('jsonwebtoken');
  const User = require('./models/User');

  io.use(async (socket, next) => {
    try {
      const cookieHeader = socket.handshake.headers.cookie;
      let cookieToken = null;
      if (cookieHeader) {
        const cookies = cookieHeader.split(';').reduce((acc, cookie) => {
          const [key, value] = cookie.split('=').map(c => c.trim());
          if (key) acc[key] = value;
          return acc;
        }, {});
        cookieToken = cookies.token;
      }

      const token = socket.handshake.auth?.token || socket.handshake.query?.token || cookieToken;
      if (!token) {
        return next(new Error('Unauthorized: No authentication token provided'));
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.userId || decoded.id);

      if (!user) {
        return next(new Error('Unauthorized: User not found'));
      }

      if (user.isActive === false) {
        return next(new Error('Unauthorized: Account is deactivated'));
      }

      socket.user = user;
      next();
    } catch (err) {
      logger.error('Socket authentication failed: %s', err.message);
      return next(new Error('Unauthorized: Invalid or expired token'));
    }
  });

  io.on('connection', (socket) => {
    logger.info('New client connected: %s', socket.id);

    // Join a specific ride room (H-6 room authorization check)
    socket.on('join-ride', async (data) => {
      const { rideId } = data;
      if (!rideId) return;

      try {
        const Ride = require('./models/Ride');
        const ride = await Ride.findById(rideId);
        if (!ride) {
          logger.warn('Socket %s tried to join non-existent ride: %s', socket.id, rideId);
          return;
        }

        const userId = socket.user._id.toString();
        const isAdmin = socket.user.role === 'admin';
        const isClient = socket.user.role === 'client' && ride.client.toString() === userId;
        const isDriver = socket.user.role === 'driver' && (ride.status === 'pending' || (ride.driver && ride.driver.toString() === userId));

        if (isAdmin || isClient || isDriver) {
          socket.join(`ride_${rideId}`);
          logger.info('Socket %s (User: %s) joined room: ride_%s', socket.id, socket.user.fullName, rideId);
        } else {
          logger.warn('Unauthorized room join attempt by user %s for ride room %s', userId, rideId);
        }
      } catch (err) {
        logger.error('Error in join-ride authorization:', err);
      }
    });

    // Leave a specific ride room
    socket.on('leave-ride', (data) => {
      const { rideId } = data;
      if (rideId) {
        socket.leave(`ride_${rideId}`);
        logger.info('Socket %s left room: ride_%s', socket.id, rideId);
      }
    });

    // Listen for real-time location sent from driver/client
    // SECURITY: Use authenticated socket.user instead of client-sent role/userId
    socket.on('send-location', (data) => {
      const { rideId, latitude, longitude } = data;
      if (!rideId) return;

      // Validate coordinate ranges
      const lat = Number(latitude);
      const lng = Number(longitude);
      if (isNaN(lat) || isNaN(lng) || lat < -90 || lat > 90 || lng < -180 || lng > 180) {
        return; // silently drop invalid coordinates
      }

      // Verify the socket user is actually in the ride room
      if (!socket.rooms.has(`ride_${rideId}`)) {
        return; // user is not in this ride room, reject
      }

      // Broadcast location using server-verified identity
      io.to(`ride_${rideId}`).emit('receive-location', {
        id: socket.id,
        latitude: lat,
        longitude: lng,
        rideId,
        role: socket.user.role,
        userId: socket.user._id.toString()
      });
    });

    socket.on('disconnecting', () => {
      logger.info('Client disconnecting: %s', socket.id);
      // Notify other clients in the same ride room(s) to remove the marker
      socket.rooms.forEach((room) => {
        if (room.startsWith('ride_')) {
          socket.to(room).emit('user-disconnected', socket.id);
        }
      });
    });

    socket.on('disconnect', () => {
      logger.info('Client disconnected: %s', socket.id);
    });
  });

  // Attach io to app so it can be used in controllers
  app.set('io', io);

  const PORT = process.env.PORT || 5000;

  server.listen(PORT, () => {
    logger.info(`Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
  });

  // Periodically clean up expired OTPs from Ride documents (every 1 hour)
  const otpCleanupInterval = setInterval(async () => {
    try {
      const Ride = require('./models/Ride');
      const result = await Ride.updateMany(
        { otpExpiresAt: { $lt: new Date() } },
        { $set: { rideOtp: null, rideOtpHash: null, otpExpiresAt: null } }
      );
      if (result.modifiedCount > 0) {
        logger.info(`[OTP CLEANUP] Cleaned up expired OTP fields for ${result.modifiedCount} rides`);
      }
    } catch (error) {
      logger.error('[OTP CLEANUP] Failed to clean up expired OTP fields: %s', error.message);
    }
  }, 3600000); // 1 hour

  // Graceful shutdown handler
  const gracefulShutdown = (signal) => {
    logger.info('%s received. Shutting down gracefully...', signal);
    clearInterval(otpCleanupInterval);
    server.close(() => {
      logger.info('HTTP server closed.');
      mongoose.connection.close(false).then(() => {
        logger.info('MongoDB connection closed.');
        process.exit(0);
      });
    });

    // Force shutdown after 10 seconds if graceful shutdown hangs
    setTimeout(() => {
      logger.error('Forced shutdown after timeout.');
      process.exit(1);
    }, 10000);
  };

  process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
  process.on('SIGINT', () => gracefulShutdown('SIGINT'));
};

startServer().catch((error) => {
  logger.error('Failed to start server:', error);
  process.exit(1);
});
