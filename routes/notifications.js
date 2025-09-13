// routes/notifications.js
import express from 'express';
const router = express.Router();
import { protect } from '../middleware/auth.js';
import {
  getUserNotifications,
  markAsRead,
  markAllAsRead,
  getUnreadCount
} from '../controllers/notificationController.js';

// All routes are protected
router.use(protect);

router.get('/', getUserNotifications);
router.put('/:id/read', markAsRead);
router.put('/read-all', markAllAsRead);
router.get('/unread-count', getUnreadCount);


export default  router;