// controllers/authController.js
import User from '../models/User.js';
import Car from '../models/Car.js';
import jwt from 'jsonwebtoken';
import { cloudinary } from '../config/cloudinary.js';
import { generateQRCode } from '../utils/generateQR.js';
import { sendEmail,emailTemplates } from '../utils/emailService.js';

import  { logActivity } from './activityController.js';



// Generate JWT Token
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN
  });
};

// Register user
export const register = async (req, res) => {
  try {
    const { fullName, studentStaffId, email, password, phoneNumber, role, carDetails } = req.body;
    console.log("register body = ", req.body)
    // Check if user already exists
    const existingUser = await User.findOne({
      $or: [{ email }, { studentStaffId }]
    });
    
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'User already exists with this email or ID'
      });
    }
    
    // Create user
    const user = await User.create({
      fullName,
      studentStaffId,
      email,
      password,
      phoneNumber,
      role
    });
    
    // Upload profile picture if provided
    if (req.files && req.files.profilePicture) {
      const result = await cloudinary.uploader.upload(req.files.profilePicture[0].path, {
        folder: 'aaua-parking/profiles'
      });
      
      user.profilePicture = {
        url: result.secure_url,
        publicId: result.public_id
      };
      await user.save();
    }
    let qrUpload
    // Create car and generate QR code if car details provided
    if (carDetails) {
      const qrCodeData = `USER:${user.studentStaffId}|CAR:${carDetails.plateNumber}|TIMESTAMP:${Date.now()}`;
      const qrCodeImage = await generateQRCode(qrCodeData);
      
       qrUpload = await cloudinary.uploader.upload(qrCodeImage, {
        folder: 'aaua-parking/qrcodes'
      });
      console.log("qrUpload = ",qrUpload )
      // Upload car picture
      let carPicture = {};
      if (req.files && req.files.carPicture) {
        const carPicUpload = await cloudinary.uploader.upload(req.files.carPicture[0].path, {
          folder: 'aaua-parking/cars'
        });
        
        carPicture = {
          url: carPicUpload.secure_url,
          publicId: carPicUpload.public_id
        };
      }
      
      // Create car
      await Car.create({
        plateNumber: carDetails.plateNumber,
        model: carDetails.model,
        color: carDetails.color,
        carPicture,
        qrCodeData,
        qrCodeImage: {
          url: qrUpload.secure_url,
          publicId: qrUpload.public_id
        },
        userId: user._id
      });
    }
    
    // Generate token
    const token = generateToken(user._id);
    
    res.status(201).json({
  success: true,
  token,
  user: {
    id: user._id,
    fullName: user.fullName,
    email: user.email,
    studentStaffId: user.studentStaffId,
    role: user.role
  },
  qrCodeUrl: qrUpload.secure_url, // Add this line
  car: {
    plateNumber: carDetails.plateNumber,
    model: carDetails.model,
    color: carDetails.color
  }
});
  } catch (error) {
    console.log("error in sign up = ",error)
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Login user
export const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    console.log("login body = ", req.body)
    // Check if user exists
    const user = await User.findOne({ email }).select('+password');
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }
    
    // Check password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }
    
    // Generate token
    const token = generateToken(user._id);
    
    res.json({
      success: true,
      token,
      user: {
        id: user._id,
        fullName: user.fullName,
        email: user.email,
        studentStaffId: user.studentStaffId,
        role: user.role
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Admin login
export const signInAdmin = async (req, res) => {
  
    const { email, password } = req.body;
    console.log("admin body = ",req.body)
  try {
    // Check if user exists and is admin
    const user = await User.findOne({ email, role: 'admin' }).select('+password');
    console.log("admin user = ", user)
    if (!user) {
      return { 
        success: false, 
        error: 'Invalid credentials or not authorized' 
      };
    }
    
    // Check password
    const isMatch = await user.comparePassword(password);
    console.log("match = ", isMatch)
    if (!isMatch) {
      return { success: false, error: 'Invalid credentials' };
    }
    
    // Generate token
    const token = generateToken(user._id);
    
    // Log activity
    const activity = await logActivity(user._id, 'admin_login', {
      timestamp: new Date().toISOString()
    });

    console.log("activity = ", activity)
    
    return { 
      success: true, 
      token, 
      user: {
        id: user._id,
        fullName: user.fullName,
        email: user.email,
        studentStaffId: user.studentStaffId,
        role: user.role
      }
    };
  } catch (error) {
    console.error('Error with admin login:', error);
    return { success: false, error: error.message };
  }
};


// ... existing code ...

// Forgot password
export const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found with this email'
      });
    }
    
    // Generate reset token
    const resetToken = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
      expiresIn: '1h'
    });
    
    // Create reset URL
    const resetUrl = `${req.protocol}://${req.get('host')}/api/auth/resetpassword/${resetToken}`;
    
    // Send email using the email template
    const emailTemplate = emailTemplates.passwordReset(resetUrl, user);
    const emailResult = await sendEmail({
      to: user.email,
      subject: emailTemplate.subject,
      html: emailTemplate.html
    });
    
    if (!emailResult.success) {
      return res.status(500).json({
        success: false,
        message: 'Email could not be sent'
      });
    }
    
    res.json({
      success: true,
      message: 'Email sent successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Reset password
export const resetPassword = async (req, res) => {
  try {
    const { token } = req.params;
    const { password } = req.body;
    
    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id);
    
    if (!user) {
      return res.status(400).json({
        success: false,
        message: 'Invalid token'
      });
    }
    
    // Update password
    user.password = password;
    await user.save();
    
    // Log activity
    await logActivity(user._id, 'password_reset', {
      resetAt: new Date().toISOString()
    });
    
    res.json({
      success: true,
      message: 'Password reset successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Create admin account
export const createAdminAccount = async (req, res) => {
  try {
    const { fullName, email, password, adminId } = req.body;
    const createdBy = req.user.id;
    
    // Check if user already exists
    const existingUser = await User.findOne({
      $or: [{ email }, { studentStaffId: adminId }]
    });
    
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'User already exists with this email or ID'
      });
    }
    
    // Create admin user
    const user = await User.create({
      fullName,
      studentStaffId: adminId,
      email,
      password,
      role: 'admin'
    });
    
    // Get creator user details
    const creator = await User.findById(createdBy);
    
    // Send email to the new admin
    const emailTemplate = emailTemplates.adminCreated(user, creator);
    await sendEmail({
      to: user.email,
      subject: emailTemplate.subject,
      html: emailTemplate.html
    });
    
    // Log activity
    await logActivity(
      createdBy,
      'admin_created',
      {
        adminId: user._id,
        email: user.email,
        createdAt: new Date().toISOString()
      }
    );
    
    res.status(201).json({
      success: true,
      message: 'Admin account created successfully',
      user: {
        id: user._id,
        fullName: user.fullName,
        email: user.email,
        studentStaffId: user.studentStaffId,
        role: user.role
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};
