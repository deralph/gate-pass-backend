// routes/admin.js
import  express from 'express';
import {getAdminStats} from '../controllers/adminController.js';
// import  { auth, adminAuth } from '../middleware/auth.js';
const router = express.Router();

router.get('/stats', getAdminStats);

export default router