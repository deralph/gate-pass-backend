// routes/scans.js
import express from 'express';
const router = express.Router();
import { protect, authorize } from '../middleware/auth.js';
import {
  processScan,
  updateScanResult,
  getScanHistory,getUserScanHistory,getScanDetails
} from '../controllers/scanController.js';

// All routes are protected
router.use(protect);

// Only admins can access scan routes
router.use(authorize('admin'));

router.post('/process', processScan);
router.put('/:id/result', updateScanResult);
router.get('/history/:userId?', getUserScanHistory);
router.get('/history', getScanHistory);
router.get('/:scanId', getScanDetails);

export default  router;