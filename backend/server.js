require('dotenv').config();
const http = require('http');
const { Server } = require('socket.io');
const app = require('./app');
const connectDB = require('./config/db');
const createAdmin = require("./config/createAdmin");
const logger = require('./utils/logger');

// Connect to Database and start server
const startServer = async () => {
  await connectDB();
  await createAdmin();

  const server = http.createServer(app);

  // Setup Socket.IO
  const io = new Server(server, {
    cors: {
      origin: (origin, callback) => {
        if (!origin) return callback(null, true);
        const list = process.env.CLIENT_URL
            ? process.env.CLIENT_URL.split(',').map(url => url.trim())
            : ['http://localhost:5173', 'http://localhost:4173'];

        const isAllowed = list.some(allowed => origin === allowed) ||
                          origin === 'https://dms-cab-service.vercel.app' ||
                          (origin.startsWith('https://dms-cab-service') && origin.endsWith('.vercel.app')) ||
                          /^https?:\/\/localhost(:\d+)?$/.test(origin);

        if (isAllowed) {
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
    socket.on('send-location', (data) => {
      const { rideId, latitude, longitude, role, userId } = data;
      if (rideId) {
        // Broadcast location to all participants in the ride room
        // Forward role and userId so receivers can stably identify sender
        io.to(`ride_${rideId}`).emit('receive-location', {
          id: socket.id,
          latitude,
          longitude,
          rideId,
          role: role || 'unknown',
          userId: userId || null
        });
      }
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
};

startServer().catch((error) => {
  logger.error('Failed to start server:', error);
  process.exit(1);
});


