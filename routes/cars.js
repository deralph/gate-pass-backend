// routes/cars.js
import express from 'express';
import { protect } from '../middleware/auth.js';
import upload from '../middleware/upload.js';
import {
    addCar,
    getUserCars,
    updateCar,
    regenerateQRCode,deleteCar
} from '../controllers/carController.js';
const router = express.Router();

// All routes are protected
router.use(protect);

router.post('/', upload.single('carImage'), addCar);
router.get('/', getUserCars);
router.put('/:id', upload.single('carImage'), updateCar);
router.post('/:id/regenerate-qr', regenerateQRCode);
// In your routes/cars.js
router.delete('/:carId', deleteCar);

export default  router;