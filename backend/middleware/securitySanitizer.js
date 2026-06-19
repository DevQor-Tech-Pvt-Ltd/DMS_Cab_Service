const escapeHtml = require('../utils/escapeHtml');

const sanitizeValue = (val) => {
  if (typeof val === 'string') {
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
    return obj.map(sanitizeValue);
  }
  
  const cleanObj = {};
  for (const key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      // Prevent NoSQL query injection by stripping operator keys
      if (key.startsWith('$') || key.includes('.')) {
        continue;
      }
      cleanObj[key] = sanitizeValue(obj[key]);
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
