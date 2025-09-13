// backend/controllers/userController.js
import User from '../models/User.js';
import Car from '../models/Car.js';
import Activity from '../models/Activity.js';

// Get user profile
export const getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    res.json({
      success: true,
      user
    });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// Get user cars
export const getCars = async (req, res) => {
  try {
    const cars = await Car.find({ userId: req.user.id, isActive: true });
    
    res.json({
      success: true,
      cars
    });
  } catch (error) {
    console.error('Get cars error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// Get user activities
export const getActivities = async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 10;
    const activities = await Activity.find({ userId: req.user.id })
      .sort({ timestamp: -1 })
      .limit(limit);
    
    res.json({
      success: true,
      activities
    });
  } catch (error) {
    console.error('Get activities error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// Update user profile
export const updateProfile = async (req, res) => {
  try {
    const { fullName, phoneNumber } = req.body;
    
    const user = await User.findByIdAndUpdate(
      req.user.id,
      { fullName, phoneNumber, updatedAt: new Date() },
      { new: true, runValidators: true }
    ).select('-password');
    
    res.json({
      success: true,
      user
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};