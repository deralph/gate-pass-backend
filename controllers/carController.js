// controllers/carController.js
import  Car from '../models/Car.js';
import  User from '../models/User.js';
import  { generateQRCode } from '../utils/generateQR.js';
import  { cloudinary } from '../config/cloudinary.js';

// Add car
export const addCar = async (carData, userId, carImage = null) => {
  try {
    // Check if car with same plate number already exists
    const existingCar = await Car.findOne({ 
      plateNumber: carData.plateNumber.toUpperCase() 
    });
    
    if (existingCar) {
      return { 
        success: false, 
        error: 'Car with this plate number already exists' 
      };
    }
    
    // Get user data for QR code
    const user = await User.findById(userId);
    
    // Generate QR code data
    const qrCodeData = `USER:${user.studentStaffId}|CAR:${carData.plateNumber}|TIMESTAMP:${Date.now()}`;
    
    // Generate QR code image
    const qrCodeImage = await generateQRCode(qrCodeData);
    
    // Upload QR code to Cloudinary
    const qrUpload = await cloudinary.uploader.upload(qrCodeImage, {
      folder: 'aaua-parking/qrcodes'
    });
    
    // Upload car image if provided
    let carImageData = {};
    if (carImage) {
      const carUpload = await cloudinary.uploader.upload(carImage, {
        folder: 'aaua-parking/cars'
      });
      
      carImageData = {
        url: carUpload.secure_url,
        publicId: carUpload.public_id
      };
    }
    
    // Create car document
    const car = await Car.create({
      plateNumber: carData.plateNumber.toUpperCase(),
      model: carData.model,
      color: carData.color,
      carPicture: carImageData,
      qrCodeData,
      qrCodeImage: {
        url: qrUpload.secure_url,
        publicId: qrUpload.public_id
      },
      userId
    });
    
    return { success: true, car, qrCodeData };
  } catch (error) {
    console.error('Error adding car:', error);
    return { success: false, error: error.message };
  }
};

// Get user cars
export const getUserCars = async (userId) => {
  try {
    const cars = await Car.find({ userId, isActive: true });
    console.log("user cars = ",cars)
    return { success: true, cars };
  } catch (error) {
    console.error('Error fetching user cars:', error);
    return { success: false, error: error.message };
  }
};

// Update car
export const updateCar = async (carId, carData, userId, carImage = null) => {
  try {
    const car = await Car.findOne({ _id: carId, userId });
    
    if (!car) {
      return { success: false, error: 'Car not found' };
    }
    
    // Update car data
    car.model = carData.model || car.model;
    car.color = carData.color || car.color;
    
    // Update car image if provided
    if (carImage) {
      // Delete old image if exists
      if (car.carPicture.publicId) {
        await cloudinary.uploader.destroy(car.carPicture.publicId);
      }
      
      // Upload new image
      const carUpload = await cloudinary.uploader.upload(carImage, {
        folder: 'aaua-parking/cars'
      });
      
      car.carPicture = {
        url: carUpload.secure_url,
        publicId: carUpload.public_id
      };
    }
    
    await car.save();
    
    return { success: true, car };
  } catch (error) {
    console.error('Error updating car:', error);
    return { success: false, error: error.message };
  }
};

// Regenerate QR code
export const regenerateQRCode = async (carId, userId) => {
  try {
    const car = await Car.findOne({ _id: carId, userId });
    
    if (!car) {
      return { success: false, error: 'Car not found' };
    }
    
    // Get user data
    const user = await User.findById(userId);
    
    // Generate new QR code data
    const qrCodeData = `USER:${user.studentStaffId}|CAR:${car.plateNumber}|TIMESTAMP:${Date.now()}`;
    
    // Generate new QR code image
    const qrCodeImage = await generateQRCode(qrCodeData);
    
    // Delete old QR code image
    if (car.qrCodeImage.publicId) {
      await cloudinary.uploader.destroy(car.qrCodeImage.publicId);
    }
    
    // Upload new QR code
    const qrUpload = await cloudinary.uploader.upload(qrCodeImage, {
      folder: 'aaua-parking/qrcodes'
    });
    
    // Update car with new QR code
    car.qrCodeData = qrCodeData;
    car.qrCodeImage = {
      url: qrUpload.secure_url,
      publicId: qrUpload.public_id
    };
    
    await car.save();
    
    return { success: true, car, qrCodeData };
  } catch (error) {
    console.error('Error regenerating QR code:', error);
    return { success: false, error: error.message };
  }
};

// In your carController.js file
export const deleteCar = async (req, res) => {
  try {
    const { carId } = req.params;
    const userId = req.user.id; // Assuming you have user authentication

    // Find the car
    const car = await Car.findOne({ _id: carId, userId });
    
    if (!car) {
      return res.status(404).json({ 
        success: false, 
        message: 'Car not found' 
      });
    }
    
    // Delete the car image from Cloudinary if it exists
    if (car.carPicture && car.carPicture.publicId) {
      await cloudinary.uploader.destroy(car.carPicture.publicId);
    }
    
    // Delete the car from database
    await Car.deleteOne({ _id: carId });
    
    // Log the activity
    await logActivity(
      userId, 
      'car_deleted', 
      { 
        plateNumber: car.plateNumber,
        model: car.model,
        color: car.color
      }
    );
    
    res.json({ 
      success: true, 
      message: 'Car deleted successfully' 
    });
  } catch (error) {
    console.error('Error deleting car:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to delete car' 
    });
  }
};