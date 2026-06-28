const mongoose = require('mongoose');
const logger = require('../utils/logger');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const runMigration = async () => {
  try {
    const uri = process.env.MONGO_URI || process.env.MONGODB_URI;
    if (!uri) {
      throw new Error('Neither MONGO_URI nor MONGODB_URI is set in environment variables.');
    }

    logger.info('[Migration] Connecting to database...');
    await mongoose.connect(uri);
    logger.info('[Migration] Database connection established.');

    const db = mongoose.connection.db;
    const collection = db.collection('transactions');

    // 1. Fetch existing indexes
    const indexes = await collection.listIndexes().toArray();
    const hasOldIndex = indexes.some((idx) => idx.name === 'razorpayPaymentId_1');

    // 2. Drop the old unique index if it exists
    if (hasOldIndex) {
      logger.info('[Migration] Dropping old unique index: razorpayPaymentId_1');
      await collection.dropIndex('razorpayPaymentId_1');
      logger.info('[Migration] Old unique index razorpayPaymentId_1 dropped successfully.');
    } else {
      logger.info('[Migration] Old unique index razorpayPaymentId_1 was not found. Skipping drop.');
    }

    // 3. Re-create new partial unique index for razorpayPaymentId
    logger.info('[Migration] Creating partial unique index for razorpayPaymentId...');
    await collection.createIndex(
      { razorpayPaymentId: 1 },
      {
        name: 'razorpayPaymentId_1',
        unique: true,
        partialFilterExpression: {
          razorpayPaymentId: { $exists: true, $type: 'string' }
        }
      }
    );
    logger.info('[Migration] Created partial unique index for razorpayPaymentId.');

    // 4. Create partial unique index for gatewayPaymentId
    logger.info('[Migration] Creating partial unique index for gatewayPaymentId...');
    await collection.createIndex(
      { gatewayPaymentId: 1 },
      {
        unique: true,
        partialFilterExpression: {
          gatewayPaymentId: { $exists: true, $type: 'string' }
        }
      }
    );
    logger.info('[Migration] Created partial unique index for gatewayPaymentId.');

    // 5. Create partial unique index for transactionId
    logger.info('[Migration] Creating partial unique index for transactionId...');
    await collection.createIndex(
      { transactionId: 1 },
      {
        unique: true,
        partialFilterExpression: {
          transactionId: { $exists: true, $type: 'string' }
        }
      }
    );
    logger.info('[Migration] Created partial unique index for transactionId.');

    logger.info('[Migration] Index migration completed successfully.');
    process.exit(0);
  } catch (error) {
    logger.error('[Migration Error] Index migration failed: %s', error.message);
    process.exit(1);
  }
};

runMigration();
