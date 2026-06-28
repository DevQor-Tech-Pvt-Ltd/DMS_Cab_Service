const { z } = require('zod');
const logger = require('../utils/logger');

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  CLIENT_URL: z.string().min(1, 'CLIENT_URL must be specified'),
  JWT_SECRET: z.string().min(8, 'JWT_SECRET must be at least 8 characters long'),
  RAZORPAY_KEY_ID: z.string().min(1, 'RAZORPAY_KEY_ID must not be empty'),
  RAZORPAY_KEY_SECRET: z.string().min(1, 'RAZORPAY_KEY_SECRET must not be empty'),
  SMTP_USER: z.string().optional(),
  SMTP_PASS: z.string().optional(),
  SMTP_HOST: z.string().default('smtp.gmail.com'),
  SMTP_PORT: z.string().default('587'),
  RESEND_API_KEY: z.string().optional(),
  RESEND_FROM: z.string().optional(),
});

const validateEnv = () => {
  try {
    envSchema.parse(process.env);
    if (!process.env.RESEND_API_KEY && (!process.env.SMTP_USER || !process.env.SMTP_PASS)) {
      throw new z.ZodError([
        {
          code: z.ZodIssueCode.custom,
          path: ['SMTP_USER'],
          message: 'Either RESEND_API_KEY or SMTP credentials (SMTP_USER & SMTP_PASS) must be configured.',
        },
      ]);
    }
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
