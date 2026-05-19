require('dotenv').config();
const http = require('http');
const { Server } = require('socket.io');
const app = require('./app');
const connectDB = require('./config/db');
const createAdmin = require("./config/createAdmin");

createAdmin();

// Connect to Database and start server
const startServer = async () => {
  await connectDB();

  const server = http.createServer(app);

  const allowedOrigins = process.env.CLIENT_URL
    ? process.env.CLIENT_URL.split(',').map(url => url.trim())
    : ['http://localhost:5173', 'http://localhost:4173'];

  // Setup Socket.IO
  const io = new Server(server, {
    cors: {
      origin: allowedOrigins,
      methods: ['GET', 'POST'],
    },
  });

  io.on('connection', (socket) => {
    console.log('New client connected:', socket.id);

    // Listen for real-time location sent from driver/client
    socket.on('send-location', (data) => {
      // Broadcast location to all clients (including sender or excluding)
      // Since markers need to be drawn on all clients, we emit to everyone
      io.emit('receive-location', {
        id: socket.id,
        latitude: data.latitude,
        longitude: data.longitude
      });
    });

    socket.on('disconnect', () => {
      console.log('Client disconnected:', socket.id);
      // Let other clients know to remove the marker
      io.emit('user-disconnected', socket.id);
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


