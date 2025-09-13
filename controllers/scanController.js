// controllers/scanController.js
import Scan from '../models/Scan.js';
import Car from '../models/Car.js';
import User from '../models/User.js';
import { sendNotification } from './notificationController.js';
import { logActivity } from './activityController.js';

import  { sendEmail, emailTemplates } from '../utils/emailService.js';


// Process scan
export const processScan = async (qrCodeData, adminId) => {
  try {
    // Parse QR code data
    const dataParts = qrCodeData.split('|');
    const data = {};
    
    dataParts.forEach(part => {
      const [key, value] = part.split(':');
      data[key] = value;
    });
    
    const userId = data.USER;
    const plateNumber = data.CAR;
    
    // Get user and car data
    const user = await User.findById(userId);
    const car = await Car.findOne({ 
      plateNumber: plateNumber.toUpperCase(),
      userId 
    });
    
    if (!user || !car) {
      return { 
        success: false, 
        error: 'Invalid QR code: User or car not found' 
      };
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
    
    // Create scan record
    const scan = await Scan.create({
      qrCodeData,
      userId,
      carId: car._id,
      adminId,
      scanType,
      status: 'pending', // Will be updated when admin approves/rejects
      timestamp: new Date()
    });
    
    return { 
      success: true, 
      scan, 
      user: {
        fullName: user.fullName,
        email: user.email,
        studentStaffId: user.studentStaffId
      },
      car: {
        plateNumber: car.plateNumber,
        model: car.model,
        color: car.color
      },
      isCurrentlyIn
    };
  } catch (error) {
    console.error('Error processing scan:', error);
    return { success: false, error: error.message };
  }
};

// Get scan history
export const getUserScanHistory = async (userId, limit = 20) => {
  try {
    const scans = await Scan.find({ userId })
      .sort({ timestamp: -1 })
      .limit(limit)
      .populate('adminId', 'fullName')
      .populate('carId', 'plateNumber model color');
    
    return { success: true, scans };
  } catch (error) {
    console.error('Error fetching scan history:', error);
    return { success: false, error: error.message };
  }
};

// Handle access denied
export const handleAccessDenied = async (userId, plateNumber, adminId, reason = 'Driver mismatch detected') => {
  try {
    const { sendNotification } = require('./notificationController');
    
    // Send notification to user
    await sendNotification(
      userId,
      'access_denied',
      'Access Denied',
      `Your vehicle ${plateNumber} was denied access at the gate. Reason: ${reason}`,
      {
        plateNumber,
        timestamp: new Date().toISOString(),
        adminId,
        reason
      }
    );
    
    // Log security alert
    await sendNotification(
      userId,
      'security_alert',
      'Security Alert',
      `Suspicious activity detected with your vehicle ${plateNumber}. If this wasn't you, please contact security.`,
      {
        plateNumber,
        timestamp: new Date().toISOString(),
        adminId,
        type: 'unauthorized_attempt'
      }
    );
    
    return { success: true };
  } catch (error) {
    console.error('Error handling access denied:', error);
    return { success: false, error: error.message };
  }
};

// Handle vehicle usage alert
export const handleVehicleUsageAlert = async (userId, plateNumber, scanData) => {
  try {
    const { sendNotification } = require('./notificationController');
    
    await sendNotification(
      userId,
      'vehicle_usage',
      'Vehicle Access',
      `Your vehicle ${plateNumber} was used at the gate at ${new Date(scanData.timestamp).toLocaleTimeString()}`,
      {
        plateNumber,
        timestamp: scanData.timestamp,
        type: scanData.scanType,
        location: 'AAUA Main Gate'
      }
    );
    
    return { success: true };
  } catch (error) {
    console.error('Error sending vehicle usage alert:', error);
    return { success: false, error: error.message };
  }
};



// ... existing code ...

// Update scan result
export const updateScanResult = async (req, res) => {
  try {
    const { scanId } = req.params;
    const { status, remarks = '' } = req.body;
    const adminId = req.user.id;
    
    const scan = await Scan.findByIdAndUpdate(
      scanId,
      { 
        status,
        remarks,
        processedAt: new Date(),
        processedBy: adminId
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
    if (status === 'approved') {
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
      
      // Send email notification
      const emailTemplate = emailTemplates.vehicleUsage(
        scan.userId,
        scan.carId.plateNumber,
        scan.scanType,
        scan.timestamp
      );
      
      await sendEmail({
        to: scan.userId.email,
        subject: emailTemplate.subject,
        html: emailTemplate.html
      });
      
      await logActivity(
        scan.userId._id,
        `scan_${scan.scanType}`,
        {
          plateNumber: scan.carId.plateNumber,
          adminId,
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
          adminId,
          reason: remarks || 'Driver mismatch detected'
        }
      );
      
      // Send email notification
      const emailTemplate = emailTemplates.accessDenied(
        scan.userId,
        scan.carId.plateNumber,
        remarks || 'Driver mismatch detected',
        scan.timestamp
      );
      
      await sendEmail({
        to: scan.userId.email,
        subject: emailTemplate.subject,
        html: emailTemplate.html
      });
      
      await logActivity(
        scan.userId._id,
        'scan_denied',
        {
          plateNumber: scan.carId.plateNumber,
          adminId,
          scanId: scan._id,
          reason: remarks
        }
      );
    }
    
    res.json({
      success: true,
      message: `Scan ${status} successfully`,
      scan
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};


// controllers/scanController.js
export const getScanHistory = async (req, res) => {
  try {
    const { userId, limit = 20, page = 1 } = req.query;
    const skip = (page - 1) * limit;
    
    let query = {};
    if (userId) {
      query.userId = userId;
    }
    
    const scans = await Scan.find(query)
      .populate('userId', 'fullName email')
      .populate('carId', 'plateNumber model')
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

export const getScanDetails = async (req, res) => {
  try {
    const { scanId } = req.params;
    
    const scan = await Scan.findById(scanId)
      .populate('userId', 'fullName email studentStaffId')
      .populate('carId', 'plateNumber model color');
    
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