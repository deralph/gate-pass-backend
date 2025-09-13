import Scan from '../models/Scan.js';
import Car from '../models/Car.js';
import User from '../models/User.js';

export const getAdminStats = async (req, res) => {
  try {
    const totalVehicles = await Car.countDocuments();
    const activeUsers = await User.countDocuments({ isActive: true });
    
    // Get today's scans
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todaysAccess = await Scan.countDocuments({ 
      timestamp: { $gte: today } 
    });
    
    res.json({
      success: true,
      totalVehicles,
      activeUsers,
      todaysAccess
    });
  } catch (error) {
    console.error('Error fetching admin stats:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch admin stats'
    });
  }
};