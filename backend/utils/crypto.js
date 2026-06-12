const crypto = require('crypto');

// AES-256-CBC configuration
const ALGORITHM = 'aes-256-cbc';

const getEncryptionKey = () => {
  // Key must be exactly 32 bytes (256 bits).
  const secret = process.env.AADHAAR_KEY;
  if (!secret) {
    throw new Error('AADHAAR_KEY environment variable is not configured. Encryption is required for sensitive fields.');
  }
  return crypto.createHash('sha256').update(String(secret)).digest();
};

const encrypt = (text) => {
  if (!text) return text;
  
  try {
    const key = getEncryptionKey();
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    // Return IV and ciphertext combined as hex
    return `${iv.toString('hex')}:${encrypted}`;
  } catch (error) {
    console.error('Encryption failed:', error);
    return text;
  }
};

const decrypt = (encryptedText) => {
  if (!encryptedText) return encryptedText;
  
  // If it's not in our iv:encrypted format (e.g. legacy plain text), return as-is
  if (!encryptedText.includes(':')) return encryptedText;
  
  try {
    const parts = encryptedText.split(':');
    const iv = Buffer.from(parts.shift(), 'hex');
    const encryptedTextBuffer = Buffer.from(parts.join(':'), 'hex');
    const key = getEncryptionKey();
    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
    let decrypted = decipher.update(encryptedTextBuffer, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
  } catch (error) {
    console.error('Decryption failed:', error);
    return encryptedText; // Fallback to returning the stored string
  }
};

module.exports = { encrypt, decrypt };
