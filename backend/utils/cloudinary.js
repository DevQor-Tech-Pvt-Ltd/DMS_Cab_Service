const cloudinary = require('cloudinary').v2;

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

  try {
    const uploadResponse = await cloudinary.uploader.upload(fileData, {
      folder: folder,
      resource_type: 'auto', // Auto-detect resource type (images, pdfs, documents)
    });
    return uploadResponse.secure_url;
  } catch (error) {
    console.error('Cloudinary upload error:', error);
    throw new Error('Failed to upload document to Cloudinary: ' + error.message);
  }
};

module.exports = { uploadBase64Document };
