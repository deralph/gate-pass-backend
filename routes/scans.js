// routes/scans.js
import express from 'express';
import {getScanHistory,getScanDetails,processScan,updateScanResult} from '../controllers/scanController.js';
// Remove auth import if you're removing authentication completely
const router = express.Router();

// Public routes - no authentication required
router.get('/history', getScanHistory);
router.get('/:scanId', getScanDetails);

// Protected routes - still need authentication for processing scans
router.post('/process', processScan);
router.put('/:scanId/result', updateScanResult);

export default router;