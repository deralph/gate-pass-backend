// controllers/scanController.js
import mongoose from 'mongoose';
import Scan from '../models/Scan.js';
import Car from '../models/Car.js';
import User from '../models/User.js';
import { sendNotification } from './notificationController.js';
import { logActivity } from './activityController.js';
import { sendEmail, emailTemplates } from '../utils/emailService.js';

// Get scan history - FIXED VERSION
export const getScanHistory = async (req, res) => {
  try {
    const { userId, limit = 20, page = 1 } = req.query;
    const skip = (page - 1) * parseInt(limit);
    
    let query = {};
    
    // Only add userId to query if it's provided and valid
    if (userId && mongoose.Types.ObjectId.isValid(userId)) {
      query.userId = new mongoose.Types.ObjectId(userId);
    }
    
    const scans = await Scan.find(query)
      .populate('userId', 'fullName email')
      .populate('carId', 'plateNumber model')
      .populate('adminId', 'fullName')
      .sort({ timestamp: -1 })
      .limit(parseInt(limit))
      .skip(skip);
    
    res.json({
      success: true,
      scans,
      total: await Scan.countDocuments(query)
    });
  } catch (error) {
    console.error('Error fetching scan history:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch scan history'
    });
  }
};

// Process scan - FIXED VERSION
export const processScan = async (req, res) => {
  try {
    const { qrCodeData, studentStaffId } = req.body;
    
    if (!qrCodeData) {
      return res.status(400).json({
        success: false,
        error: 'QR code data is required'
      });
    }
    
    // Parse QR code data
    const dataParts = qrCodeData.split('|');
    const data = {};
    
    dataParts.forEach(part => {
      const [key, value] = part.split(':');
      if (key && value) {
        data[key] = value;
      }
    });
    
    const userId = data.USER;
    const plateNumber = data.CAR;
    
    if (!userId || !plateNumber) {
      return res.status(400).json({
        success: false,
        error: 'Invalid QR code format'
      });
    }
    
    // Get user and car data
    const user = await User.findById(userId);
    const car = await Car.findOne({ 
      plateNumber: plateNumber.toUpperCase(),
      userId 
    });
    
    if (!user || !car) {
      return res.status(404).json({ 
        success: false, 
        error: 'Invalid QR code: User or car not found' 
      });
    }
    
    // Check if user is currently in or out
    const lastScan = await Scan.findOne({ 
      userId, 
      plateNumber: car.plateNumber 
    }).sort({ timestamp: -1 });
    
    let isCurrentlyIn = false;
    if (lastScan) {
      isCurrentlyIn = lastScan.status === 'approved' && lastScan.scanType === 'in';
    }
    
    // Determine scan type
    const scanType = isCurrentlyIn ? 'out' : 'in';
    const adminstaff = await User.find({ 
      studentStaffId 
    })
    // Create scan record
    const scan = await Scan.create({
      qrCodeData,
      userId,
      carId: car._id,
      adminId:adminstaff._id,
      scanType,
      status: 'pending',
      timestamp: new Date()
    });
    
    return res.json({ 
      success: true, 
      scan, 
      user: {
        fullName: user.fullName,
        email: user.email,
        studentStaffId: user.studentStaffId,
        profilePicture: user.profilePicture
      },
      car: {
        plateNumber: car.plateNumber,
        model: car.model,
        color: car.color,
        carPicture: car.carPicture
      },
      isCurrentlyIn
    });
  } catch (error) {
    console.error('Error processing scan:', error);
    return res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
};

// Update scan result
export const updateScanResult = async (req, res) => {
  try {
    const { scanId } = req.params;
    const { result, reason } = req.body;
    
    const scan = await Scan.findByIdAndUpdate(
      scanId,
      { 
        status: result,
        reason,
        processedAt: new Date()
      },
      { new: true }
    ).populate('userId', 'fullName email phoneNumber')
     .populate('carId', 'plateNumber model color');
    
    if (!scan) {
      return res.status(404).json({
        success: false,
        message: 'Scan not found'
      });
    }
    
    // Send notification based on result
    if (result === 'approved') {
      await sendNotification(
        scan.userId._id,
        'vehicle_usage',
        'Vehicle Access',
        `Your vehicle ${scan.carId.plateNumber} was ${scan.scanType === 'in' ? 'granted entry' : 'exited'} at the gate`,
        {
          plateNumber: scan.carId.plateNumber,
          timestamp: scan.timestamp,
          type: scan.scanType,
          location: 'AAUA Main Gate'
        }
      );
      
      await logActivity(
        scan.userId._id,
        `scan_${scan.scanType}`,
        {
          plateNumber: scan.carId.plateNumber,
          adminId: scan.adminId,
          scanId: scan._id
        }
      );
    } else {
      await sendNotification(
        scan.userId._id,
        'access_denied',
        'Access Denied',
        `Your vehicle ${scan.carId.plateNumber} was denied access at the gate`,
        {
          plateNumber: scan.carId.plateNumber,
          timestamp: scan.timestamp,
          adminId: scan.adminId,
          reason: reason || 'Driver mismatch detected'
        }
      );
      
      await logActivity(
        scan.userId._id,
        'scan_denied',
        {
          plateNumber: scan.carId.plateNumber,
          adminId: scan.adminId,
          scanId: scan._id,
          reason: reason
        }
      );
    }
    
    res.json({
      success: true,
      message: `Scan ${result} successfully`,
      scan
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Get scan details
export const getScanDetails = async (req, res) => {
  try {
    const { scanId } = req.params;
    
    const scan = await Scan.findById(scanId)
      .populate('userId', 'fullName email studentStaffId profilePicture')
      .populate('carId', 'plateNumber model color carPicture');
    
    if (!scan) {
      return res.status(404).json({
        success: false,
        message: 'Scan not found'
      });
    }
    
    res.json({
      success: true,
      scan
    });
  } catch (error) {
    console.error('Error fetching scan details:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch scan details'
    });
  }
};