const mongoose = require('mongoose');
const logger = require('../utils/logger');

let mongod = null;

const connectDB = async () => {
    try {
        mongoose.set('strictQuery', false);
        let uri = process.env.MONGO_URI;

        if (!uri) {
            logger.info('No MONGO_URI specified. Starting in-memory MongoDB server...');
            const { MongoMemoryServer } = require('mongodb-memory-server');
            mongod = await MongoMemoryServer.create();
            uri = mongod.getUri();
            logger.info(`In-memory MongoDB started successfully at: ${uri}`);
        }

        await mongoose.connect(uri, {
            serverSelectionTimeoutMS: 5000,
            maxPoolSize: 10,
            minPoolSize: 2,
            socketTimeoutMS: 45000
        });
        logger.info('MongoDB connected successfully');
    } catch (error) {
        logger.error('MongoDB connection failed: %s', error.message);
        process.exit(1);
    }
};

module.exports = connectDB;
