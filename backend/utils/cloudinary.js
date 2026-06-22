const cloudinary = require('cloudinary').v2;
const logger = require('./logger');

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

/**
 * Upload base64 string to Cloudinary.
 * If already a URL (e.g. from previous upload), return as-is.
 */
const uploadBase64Document = async (fileData, folder = 'dms_luxe_documents') => {
  if (!fileData) return null;

  // If already a URL, return it
  if (fileData.startsWith('http://') || fileData.startsWith('https://')) {
    return fileData;
  }

  // Verify it's a valid data URL base64 string
  if (!fileData.startsWith('data:')) {
    return fileData; // Return as-is if it doesn't match standard data URI pattern
  }

  // Validate MIME type (L-1)
  const mimeMatch = fileData.match(/^data:([^;]+);base64,/);
  if (mimeMatch) {
    const mimeType = mimeMatch[1];
    const allowedMimeTypes = ['image/jpeg', 'image/png', 'application/pdf'];
    if (!allowedMimeTypes.includes(mimeType)) {
      throw new Error(`Invalid file type: ${mimeType}. Only JPEG, PNG, and PDF are allowed.`);
    }
  }

  // Validate file size — max 5MB (Audit 16.1)
  const MAX_SIZE_MB = 5;
  const base64Payload = fileData.replace(/^data:[^;]+;base64,/, '');
  const sizeInBytes = Buffer.byteLength(base64Payload, 'base64');
  if (sizeInBytes > MAX_SIZE_MB * 1024 * 1024) {
    throw new Error(`File size (${(sizeInBytes / (1024 * 1024)).toFixed(1)}MB) exceeds the ${MAX_SIZE_MB}MB limit.`);
  }

  try {
    const uploadResponse = await cloudinary.uploader.upload(fileData, {
      folder: folder,
      resource_type: 'auto', // Auto-detect resource type (images, pdfs, documents)
    });
    return uploadResponse.secure_url;
  } catch (error) {
    logger.error('Cloudinary upload error: %s. Falling back to storing document as base64 string directly in database.', error.message);
    return fileData; // Fallback to base64 string so registration/profile update does not fail
  }
};

module.exports = { uploadBase64Document };
