const dotenv = require('dotenv');
const mongoose = require('mongoose');
const path = require('path');
const http = require('http');
const express = require('express');
const { Server } = require('socket.io');
const ioClient = require('socket.io-client');
const jwt = require('jsonwebtoken');

// Load env
dotenv.config({ path: path.join(__dirname, '../.env') });

const connectDB = require('../config/db');
const User = require('../models/User');
const Ride = require('../models/Ride');

const PORT = 5001;

async function runAgent3() {
  console.log('============================================================');
  console.log('🤖 AGENT 3: LIVE LOCATION TRACKING (SOCKET.IO) TEST');
  console.log('============================================================');

  let server = null;
  let io = null;
  let driverUser = null;
  let clientUser = null;
  let testRide = null;
  
  let driverSocket = null;
  let passengerSocket = null;

  try {
    // 1. Connect to Database
    console.log('\n--- Step 1: Connecting to MongoDB ---');
    await connectDB();
    console.log('✅ Connected to MongoDB.');

    // 2. Setup Test Data (Driver, Client, Ride)
    console.log('\n--- Step 2: Creating Test Driver, Client, and Ride ---');
    driverUser = await User.create({
      fullName: 'Agent Three Driver',
      email: `driver3_${Date.now()}@test.com`,
      phone: `+91888888${Math.floor(1000 + Math.random() * 9000)}`,
      role: 'driver',
      status: 'approved',
      isApproved: true,
      password: 'TestPassword123!'
    });

    clientUser = await User.create({
      fullName: 'Agent Three Passenger',
      email: `passenger3_${Date.now()}@test.com`,
      phone: `+91777777${Math.floor(1000 + Math.random() * 9000)}`,
      role: 'client',
      status: 'approved',
      isApproved: true,
      password: 'TestPassword123!'
    });

    testRide = await Ride.create({
      client: clientUser._id,
      driver: driverUser._id,
      pickupLocation: 'Driver Base',
      dropoffLocation: 'Passenger Base',
      pickupDate: '2026-06-21',
      pickupTime: '18:00',
      vehicleType: 'Mercedes E-Class',
      fare: 3000,
      paymentMethod: 'cash',
      status: 'driver_assigned',
      passengerDetails: {
        fullName: clientUser.fullName,
        email: clientUser.email,
        phone: clientUser.phone
      }
    });

    console.log(`✅ Test users and ride assigned. RideID = ${testRide._id}`);

    // 3. Generate JWT Tokens
    const driverToken = jwt.sign(
      { userId: driverUser._id.toString(), role: 'driver', email: driverUser.email },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );

    const passengerToken = jwt.sign(
      { userId: clientUser._id.toString(), role: 'client', email: clientUser.email },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );

    // 4. Start Local Test Socket.IO Server
    console.log('\n--- Step 3: Spinning up Test Socket.IO Server ---');
    const app = express();
    server = http.createServer(app);
    io = new Server(server);

    // Replicate authentication middleware from server.js
    io.use(async (socket, next) => {
      try {
        const token = socket.handshake.auth?.token || socket.handshake.query?.token;
        if (!token) {
          return next(new Error('Unauthorized: No token'));
        }
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await User.findById(decoded.userId || decoded.id);
        if (!user) {
          return next(new Error('Unauthorized: User not found'));
        }
        socket.user = user;
        next();
      } catch (err) {
        return next(new Error('Unauthorized: Invalid token'));
      }
    });

    // Replicate socket connection & event handlers from server.js
    io.on('connection', (socket) => {
      socket.on('join-ride', async (data) => {
        const { rideId } = data;
        if (!rideId) return;

        try {
          const ride = await Ride.findById(rideId);
          if (!ride) return;

          const userId = socket.user._id.toString();
          const isAdmin = socket.user.role === 'admin';
          const isClient = socket.user.role === 'client' && ride.client.toString() === userId;
          const isDriver = socket.user.role === 'driver' && (ride.driver && ride.driver.toString() === userId);

          if (isAdmin || isClient || isDriver) {
            socket.join(`ride_${rideId}`);
            socket.emit('joined', { success: true, room: `ride_${rideId}` });
          }
        } catch (err) {
          console.error('Error in join-ride:', err);
        }
      });

      socket.on('send-location', (data) => {
        const { rideId, latitude, longitude } = data;
        if (!rideId) return;

        const lat = Number(latitude);
        const lng = Number(longitude);
        if (isNaN(lat) || isNaN(lng) || lat < -90 || lat > 90 || lng < -180 || lng > 180) {
          return;
        }

        // Room checking safety feature
        if (!socket.rooms.has(`ride_${rideId}`)) {
          return; 
        }

        io.to(`ride_${rideId}`).emit('receive-location', {
          id: socket.id,
          latitude: lat,
          longitude: lng,
          rideId,
          role: socket.user.role,
          userId: socket.user._id.toString()
        });
      });
    });

    await new Promise((resolve) => server.listen(PORT, resolve));
    console.log(`✅ Test server running on http://localhost:${PORT}`);

    // 5. Connect WebSocket Clients
    console.log('\n--- Step 4: Connecting Client and Driver Sockets ---');
    
    driverSocket = ioClient(`http://localhost:${PORT}`, {
      auth: { token: driverToken },
      transports: ['websocket']
    });

    passengerSocket = ioClient(`http://localhost:${PORT}`, {
      auth: { token: passengerToken },
      transports: ['websocket']
    });

    await Promise.all([
      new Promise((resolve) => driverSocket.on('connect', resolve)),
      new Promise((resolve) => passengerSocket.on('connect', resolve))
    ]);
    console.log('✅ Both Driver and Passenger sockets authenticated and connected.');

    // 6. Join Ride Room
    console.log('\n--- Step 5: Joining Ride Room ---');
    driverSocket.emit('join-ride', { rideId: testRide._id.toString() });
    passengerSocket.emit('join-ride', { rideId: testRide._id.toString() });

    await Promise.all([
      new Promise((resolve) => driverSocket.on('joined', resolve)),
      new Promise((resolve) => passengerSocket.on('joined', resolve))
    ]);
    console.log('✅ Both sockets successfully joined the ride room.');

    // 7. Test Location Tracking & Broadcast Reception
    console.log('\n--- Step 6: Testing Coordinates Transmission & Reception ---');
    const testCoordinates = {
      rideId: testRide._id.toString(),
      latitude: 22.5726,
      longitude: 88.3639
    };

    const locationReceivedPromise = new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error('Location receive timeout: Passenger socket did not receive coordinates.'));
      }, 5000);

      passengerSocket.on('receive-location', (data) => {
        clearTimeout(timeout);
        resolve(data);
      });
    });

    // Driver sends coordinates
    driverSocket.emit('send-location', testCoordinates);
    console.log(`Driver sent coordinates: lat=${testCoordinates.latitude}, lng=${testCoordinates.longitude}`);

    const receivedData = await locationReceivedPromise;
    console.log(`Passenger received coordinates: lat=${receivedData.latitude}, lng=${receivedData.longitude}, senderRole=${receivedData.role}`);

    if (receivedData.latitude === testCoordinates.latitude && receivedData.longitude === testCoordinates.longitude) {
      console.log('✅ Coordinate match verified. Location tracking is fully functional.');
    } else {
      throw new Error(`Coordinate mismatch! Sent ${JSON.stringify(testCoordinates)}, but received ${JSON.stringify(receivedData)}`);
    }

    console.log('\n🎉 ALL AGENT 3 TESTS PASSED SUCCESSFULLY! 🎉');

  } catch (error) {
    console.error('\n❌ AGENT 3 RUN FAILED:', error.stack || error.message);
    process.exit(1);
  } finally {
    // Cleanup sockets and server
    console.log('\n--- Step 7: Cleaning up and tearing down ---');
    if (driverSocket) driverSocket.disconnect();
    if (passengerSocket) passengerSocket.disconnect();
    if (io) io.close();
    if (server) server.close();

    if (driverUser) await User.deleteOne({ _id: driverUser._id });
    if (clientUser) await User.deleteOne({ _id: clientUser._id });
    if (testRide) await Ride.deleteOne({ _id: testRide._id });
    console.log('🧹 Test DB records removed.');

    await mongoose.connection.close();
    console.log('\nDatabase connection closed. Agent 3 finished.');
  }
}

runAgent3();
