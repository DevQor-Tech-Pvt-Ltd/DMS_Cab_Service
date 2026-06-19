const escapeHtml = require('../utils/escapeHtml');

// List of keys to exclude from HTML-escaping to prevent password/token corruption and payload overhead
const EXCLUDED_KEYS = new Set([
  'password',
  'confirmPassword',
  'newPassword',
  'currentPassword',
  'rcDocument',
  'licenseDocument',
  'profilePicture',
  'token',
  'refreshToken',
  'accessToken',
  'otp',
  'rideOtp'
]);

// Checks if a string is a base64 data URL
const isBase64DataUrl = (str) => {
  if (typeof str !== 'string') return false;
  // Quick prefix check to avoid expensive regex matches on large strings
  return str.startsWith('data:') && str.includes(';base64,');
};

const sanitizeValue = (val, key = null) => {
  if (typeof val === 'string') {
    // If the key is in our exclusion set or the value looks like a base64 document, bypass HTML-escaping
    if ((key && EXCLUDED_KEYS.has(key)) || isBase64DataUrl(val)) {
      return val;
    }
    // Prevent HTML/JS tag injection
    return escapeHtml(val).trim();
  }
  if (typeof val === 'object' && val !== null) {
    return sanitizeObject(val);
  }
  return val;
};

const sanitizeObject = (obj) => {
  if (Array.isArray(obj)) {
    return obj.map(item => sanitizeValue(item));
  }
  
  const cleanObj = {};
  for (const key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      // Prevent NoSQL query injection by stripping operator keys
      if (key.startsWith('$') || key.includes('.')) {
        continue;
      }
      cleanObj[key] = sanitizeValue(obj[key], key);
    }
  }
  return cleanObj;
};

const securitySanitizer = (req, res, next) => {
  if (req.body) {
    req.body = sanitizeObject(req.body);
  }
  if (req.query) {
    req.query = sanitizeObject(req.query);
  }
  if (req.params) {
    req.params = sanitizeObject(req.params);
  }
  next();
};

module.exports = securitySanitizer;
