const mongoose = require('mongoose');

let mongod = null;

const connectDB = async () => {
    try {
        mongoose.set('strictQuery', false);
        let uri = process.env.MONGO_URI;

        if (!uri) {
            console.log('No MONGO_URI specified. Starting in-memory MongoDB server...');
            const { MongoMemoryServer } = require('mongodb-memory-server');
            mongod = await MongoMemoryServer.create();
            uri = mongod.getUri();
            console.log(`In-memory MongoDB started successfully at: ${uri}`);
        }

        await mongoose.connect(uri, {
            serverSelectionTimeoutMS: 5000,
        });
        console.log('MongoDB connected successfully');
    } catch (error) {
        console.error('MongoDB connection failed:', error.message);
        process.exit(1);
    }
};

module.exports = connectDB;
