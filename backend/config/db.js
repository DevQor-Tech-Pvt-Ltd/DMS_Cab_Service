const mongoose = require('mongoose');
const logger = require('../utils/logger');

let mongod = null;

/**
 * Connect to MongoDB with connection pooling and retry logic (exponential backoff)
 */
const connectDB = async () => {
    mongoose.set('strictQuery', false);
    let uri = process.env.MONGO_URI;

    if (!uri) {
        logger.info('No MONGO_URI specified. Starting in-memory MongoDB server...');
        try {
            const { MongoMemoryServer } = require('mongodb-memory-server');
            mongod = await MongoMemoryServer.create();
            uri = mongod.getUri();
            logger.info(`In-memory MongoDB started successfully at: ${uri}`);
        } catch (memError) {
            logger.error('Failed to start in-memory MongoDB server: %s', memError.message);
            process.exit(1);
        }
    }

    const maxPoolSize = parseInt(process.env.MONGO_MAX_POOL_SIZE || '100', 10);
    const minPoolSize = parseInt(process.env.MONGO_MIN_POOL_SIZE || '5', 10);
    const serverSelectionTimeoutMS = parseInt(process.env.MONGO_SELECTION_TIMEOUT_MS || '5000', 10);
    const socketTimeoutMS = parseInt(process.env.MONGO_SOCKET_TIMEOUT_MS || '45000', 10);

    const maxRetries = parseInt(process.env.MONGO_CONNECT_RETRIES || '5', 10);
    let delay = 2000; // start with 2 seconds delay

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
            logger.info(`[Database] Connecting to MongoDB (Attempt ${attempt}/${maxRetries}) with maxPoolSize=${maxPoolSize}, minPoolSize=${minPoolSize}...`);
            await mongoose.connect(uri, {
                serverSelectionTimeoutMS,
                maxPoolSize,
                minPoolSize,
                socketTimeoutMS
            });
            logger.info('[Database] MongoDB connected successfully');
            return;
        } catch (error) {
            logger.error(`[Database] MongoDB connection attempt ${attempt} failed: %s`, error.message);
            if (attempt === maxRetries) {
                logger.error('[Database] All database connection attempts failed. Exiting process.');
                process.exit(1);
            }
            logger.info(`[Database] Waiting ${delay / 1000}s before next connection attempt...`);
            await new Promise((resolve) => setTimeout(resolve, delay));
            delay *= 2; // exponential backoff
        }
    }
};

module.exports = connectDB;

