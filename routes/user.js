// backend/routes/users.js
import express from 'express';
import { protect } from '../middleware/auth.js';
import {
  getProfile,
  getCars,
  getActivities,
  updateProfile
} from '../controllers/userController.js';

const router = express.Router();

// All routes are protected
router.use(protect);

router.get('/profile', getProfile);
router.get('/cars', getCars);
router.get('/activities', getActivities);
router.put('/profile', updateProfile);

export default router;