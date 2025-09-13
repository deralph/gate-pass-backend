// middleware/upload.js
import multer from 'multer';
import { storage } from '../config/cloudinary.js';

const upload = multer({ 
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    console.log("Initial request body in uploads:", req.body);
  
    console.log("Processing file:", file.fieldname);
    
    // Check if file exists (might be undefined for optional fields)
    if (!file) {
      console.log("No file provided for field:", file.fieldname);
      return cb(null, false); // Skip this field
    }
    
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'), false);
    }
  }
});

export default upload;