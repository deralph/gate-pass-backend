// utils/storageService.js
import  { cloudinary } from '../config/cloudinary.js';

// Upload to Cloudinary
exports.uploadToStorage = async (file, folder = 'aaua-parking') => {
  try {
    // If file is a data URL, convert it to a buffer
    let uploadResponse;
    
    if (file.startsWith('data:')) {
      // Handle data URL
      const matches = file.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
      
      if (matches.length !== 3) {
        throw new Error('Invalid data URL');
      }
      
      const buffer = Buffer.from(matches[2], 'base64');
      
      uploadResponse = await new Promise((resolve, reject) => {
        cloudinary.uploader.upload_stream(
          { folder },
          (error, result) => {
            if (error) reject(error);
            else resolve(result);
          }
        ).end(buffer);
      });
    } else {
      // Handle file path (for server-side uploads)
      uploadResponse = await cloudinary.uploader.upload(file, { folder });
    }
    
    return {
      success: true,
      url: uploadResponse.secure_url,
      publicId: uploadResponse.public_id
    };
  } catch (error) {
    console.error('Upload to storage error:', error);
    return { success: false, error: error.message };
  }
};

// Delete from Cloudinary
exports.deleteFromStorage = async (publicId) => {
  try {
    const result = await cloudinary.uploader.destroy(publicId);
    return { success: true, result };
  } catch (error) {
    console.error('Delete from storage error:', error);
    return { success: false, error: error.message };
  }
};