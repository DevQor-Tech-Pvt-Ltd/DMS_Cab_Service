require('dotenv').config();
const http = require('http');
const { Server } = require('socket.io');
const app = require('./app');
const connectDB = require('./config/db');
const createAdmin = require("./config/createAdmin");

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
                          origin.endsWith('.vercel.app') || 
                          process.env.NODE_ENV === 'development';

        if (isAllowed) {
          callback(null, true);
        } else {
          callback(new Error('Not allowed by CORS'));
        }
      },
      methods: ['GET', 'POST'],
    },
  });

  io.on('connection', (socket) => {
    console.log('New client connected:', socket.id);

    // Join a specific ride room
    socket.on('join-ride', (data) => {
      const { rideId } = data;
      if (rideId) {
        socket.join(`ride_${rideId}`);
        console.log(`Socket ${socket.id} joined room: ride_${rideId}`);
      }
    });

    // Leave a specific ride room
    socket.on('leave-ride', (data) => {
      const { rideId } = data;
      if (rideId) {
        socket.leave(`ride_${rideId}`);
        console.log(`Socket ${socket.id} left room: ride_${rideId}`);
      }
    });

    // Listen for real-time location sent from driver/client
    socket.on('send-location', (data) => {
      const { rideId, latitude, longitude } = data;
      if (rideId) {
        // Broadcast location only to clients in the specific ride room
        io.to(`ride_${rideId}`).emit('receive-location', {
          id: socket.id,
          latitude,
          longitude,
          rideId
        });
      }
    });

    socket.on('disconnecting', () => {
      console.log('Client disconnecting:', socket.id);
      // Notify other clients in the same ride room(s) to remove the marker
      socket.rooms.forEach((room) => {
        if (room.startsWith('ride_')) {
          socket.to(room).emit('user-disconnected', socket.id);
        }
      });
    });

    socket.on('disconnect', () => {
      console.log('Client disconnected:', socket.id);
    });
  });

  // Attach io to app so it can be used in controllers
  app.set('io', io);

  const PORT = process.env.PORT || 5000;

  server.listen(PORT, () => {
    console.log(`Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
  });
};

startServer().catch((error) => {
  console.error('Failed to start server:', error);
  process.exit(1);
});


