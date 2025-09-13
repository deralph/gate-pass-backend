// models/Car.js
import mongoose from 'mongoose';

const carSchema = new mongoose.Schema({
  plateNumber: {
    type: String,
    required: true,
    uppercase: true,
    unique: true
  },
  model: {
    type: String,
    required: true
  },
  color: {
    type: String,
    required: true
  },
  carPicture: {
    url: String,
    publicId: String
  },
  qrCodeData: {
    type: String,
    required: true
  },
  qrCodeImage: {
    url: String,
    publicId: String
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

export default  mongoose.model('Car', carSchema);