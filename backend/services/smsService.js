const logger = require('../utils/logger');

/**
 * Enterprise SMS Gateway Service stub.
 * By default, in development, it logs OTPs to the console/log files to facilitate testing.
 * For production, configure the Twilio integration using credentials from environment variables.
 */
exports.sendSMS = async (phone, message) => {
  logger.info(`[SMS GATEWAY] Sending SMS to ${phone}: ${message}`);
  
  if (process.env.NODE_ENV === 'production' && process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN) {
    try {
      const twilio = require('twilio');
      const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
      
      const response = await client.messages.create({
        body: message,
        from: process.env.TWILIO_PHONE_NUMBER,
        to: phone
      });
      
      logger.info(`[SMS GATEWAY] Twilio SMS dispatched successfully: SID=${response.sid}`);
      return true;
    } catch (err) {
      logger.error(`[SMS GATEWAY] Twilio SMS dispatch failed: %s`, err.message);
      return false;
    }
  }
  
  // Console logging fallback for developer local verification
  console.log('\n=============================================');
  console.log(`[DEV SMS] SMS Sent to: ${phone}`);
  console.log(`[DEV SMS] Content: ${message}`);
  console.log('=============================================\n');
  return true;
};
