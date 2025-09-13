// controllers/notificationController.js
import Notification  from '../models/Notification.js';

// Send notification
export const sendNotification = async (userId, type, title, message, data = {}) => {
  try {
    const notification = await Notification.create({
      userId,
      type,
      title,
      message,
      data,
      read: false
    });
    
    return { success: true, notification };
  } catch (error) {
    console.error('Error sending notification:', error);
    return { success: false, error: error.message };
  }
};

// Get user notifications
export const getUserNotifications = async (userId, limit = 20) => {
  try {
    const notifications = await Notification.find({ userId })
      .sort({ createdAt: -1 })
      .limit(limit);
    
    return { success: true, notifications };
  } catch (error) {
    console.error('Error fetching notifications:', error);
    return { success: false, error: error.message };
  }
};

// Mark as read
export const markAsRead = async (notificationId, userId) => {
  try {
    const notification = await Notification.findOneAndUpdate(
      { _id: notificationId, userId },
      { read: true },
      { new: true }
    );
    
    if (!notification) {
      return { success: false, error: 'Notification not found' };
    }
    
    return { success: true, notification };
  } catch (error) {
    console.error('Error marking notification as read:', error);
    return { success: false, error: error.message };
  }
};

// Mark all as read
export const markAllAsRead = async (userId) => {
  try {
    await Notification.updateMany(
      { userId, read: false },
      { read: true }
    );
    
    return { success: true };
  } catch (error) {
    console.error('Error marking all notifications as read:', error);
    return { success: false, error: error.message };
  }
};

// Get unread count
export const getUnreadCount = async (userId) => {
  try {
    const count = await Notification.countDocuments({ 
      userId, 
      read: false 
    });
    
    return { success: true, count };
  } catch (error) {
    console.error('Error getting unread count:', error);
    return { success: false, error: error.message };
  }
};