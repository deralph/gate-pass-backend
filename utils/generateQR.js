// utils/generateQR.js
import QRCode from 'qrcode';

// Generate QR code data
export const generateQRCodeData = (userId, userIdentifier, plateNumber) => {
  return `USER:${userId}|ID:${userIdentifier}|CAR:${plateNumber}|TIMESTAMP:${Date.now()}`;
};

// Generate QR code image
export const generateQRCode = async (data) => {
  try {
    // Generate QR code as data URL
    const qrCodeDataURL = await QRCode.toDataURL(data, {
      width: 300,
      margin: 2,
      color: {
        dark: '#000000',
        light: '#FFFFFF'
      }
    });
    
    return qrCodeDataURL;
  } catch (error) {
    console.error('Error generating QR code:', error);
    throw error;
  }
};

// Save QR code to Cloudinary
export const saveQRCode = async (userId, plateNumber, qrCodeData) => {
  try {
    const { cloudinary } = require('../config/cloudinary');
    const { generateQRCode } = require('./generateQR');
    
    // Generate QR code image
    const qrCodeImage = await generateQRCode(qrCodeData);
    
    // Upload to Cloudinary
    const result = await cloudinary.uploader.upload(qrCodeImage, {
      folder: `aaua-parking/qrcodes/${userId}`,
      public_id: `${plateNumber}_qr`
    });
    
    return { 
      success: true, 
      url: result.secure_url, 
      publicId: result.public_id 
    };
  } catch (error) {
    console.error('Error saving QR code:', error);
    return { success: false, error: error.message };
  }
};