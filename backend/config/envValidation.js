const { z } = require('zod');
const logger = require('../utils/logger');

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  CLIENT_URL: z.string().min(1, 'CLIENT_URL must be specified'),
  JWT_SECRET: z.string().min(8, 'JWT_SECRET must be at least 8 characters long'),
  RAZORPAY_KEY_ID: z.string().min(1, 'RAZORPAY_KEY_ID must not be empty'),
  RAZORPAY_KEY_SECRET: z.string().min(1, 'RAZORPAY_KEY_SECRET must not be empty'),
  SMTP_USER: z.string().min(1, 'SMTP_USER must not be empty'),
  SMTP_PASS: z.string().min(1, 'SMTP_PASS must not be empty'),
  SMTP_HOST: z.string().default('smtp.gmail.com'),
  SMTP_PORT: z.string().default('587'),
});

const validateEnv = () => {
  try {
    envSchema.parse(process.env);
    const mongoUri = process.env.MONGO_URI || process.env.MONGODB_URI;
    if (!mongoUri) {
      throw new z.ZodError([
        {
          code: z.ZodIssueCode.custom,
          path: ['MONGO_URI'],
          message: 'Either MONGO_URI or MONGODB_URI must be specified in environment variables.',
        },
      ]);
    }
    logger.info('[Startup] Environment variables successfully validated.');
  } catch (error) {
    logger.error('[ENV VALIDATION ERROR] Critical environment variables are missing or invalid:');
    if (error instanceof z.ZodError) {
      error.errors.forEach((err) => {
        logger.error(`  - ${err.path.join('.')}: ${err.message}`);
      });
    } else {
      logger.error(`  - Unexpected error: ${error.message}`);
    }
    throw new Error('Server startup aborted due to missing/invalid environment variables.');
  }
};

module.exports = validateEnv;
