// routes/auth.js
import  express from 'express';
import  { register, login, forgotPassword,resetPassword,createAdminAccount,signInAdmin } from '../controllers/authController.js';
import  upload from '../middleware/upload.js';
import  {protect,authorize} from '../middleware/auth.js';
const  router = express.Router();

router.post('/register', (req, res, next) => {
  // Log initial request body
  console.log("Initial request body:", req.body);
  
  // Use the upload middleware
  upload.fields([
    { name: 'profilePicture', maxCount: 1 },
    { name: 'carPicture', maxCount: 1 }
  ])(req, res, (err) => {
    if (err) {
      console.error("Upload error:", err);
      return res.status(400).json({
        success: false,
        message: err.message
      });
    }
    
    // Log after upload processing
    console.log("After upload - Body:", req.body);
    console.log("After upload - Files:", req.files);
    
    // Proceed to register controller
    next();
  });
}, register);

router.post('/login', login);
router.post('/forgotpassword', forgotPassword);
router.post('/resetpassword/:token', resetPassword);
router.post('/create-admin', protect, authorize('admin'), createAdminAccount);
router.post('/admin-login', signInAdmin);

export default  router;