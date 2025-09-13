// controllers/activityController.js
import  Activity  from '../models/Activity.js';

// Log activity
export const logActivity = async (userId, action, details = {}) => {
  try {
    const activity = await Activity.create({
      userId,
      action,
      details,
      timestamp: new Date()
    });
    
    return { success: true, activity };
  } catch (error) {
    console.error('Error logging activity:', error);
    return { success: false, error: error.message };
  }
};

// Get user activities
export const getUserActivities = async (userId, limit = 50) => {
  try {
    const activities = await Activity.find({ userId })
      .sort({ timestamp: -1 })
      .limit(limit)
      .populate('userId', 'fullName email');
    
    return { success: true, activities };
  } catch (error) {
    console.error('Error fetching user activities:', error);
    return { success: false, error: error.message };
  }
};

// Get admin activities (all activities)
export const getAdminActivities = async (limit = 100) => {
  try {
    const activities = await Activity.find()
      .sort({ timestamp: -1 })
      .limit(limit)
      .populate('userId', 'fullName email role');
    
    return { success: true, activities };
  } catch (error) {
    console.error('Error fetching admin activities:', error);
    return { success: false, error: error.message };
  }
};