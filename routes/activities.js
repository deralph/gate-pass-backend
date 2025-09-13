// routes/activities.js
import express from 'express';
import { protect, authorize } from '../middleware/auth.js';
const router = express.Router();
import {
  getUserActivities,
  getAdminActivities
} from '../controllers/activityController.js';

// All routes are protected
router.use(protect);

router.get('/my-activities', getUserActivities);
router.get('/admin', authorize('admin'), getAdminActivities);

export default  router;