// models/Scan.js
import mongoose from 'mongoose';

const scanSchema = new mongoose.Schema({
  qrCodeData: {
    type: String,
    required: true
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  carId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Car',
    required: true
  },
  adminId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  scanType: {
    type: String,
    enum: ['in', 'out'],
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'denied'],
    default: 'pending'
  },
  remarks: String,
  timestamp: {
    type: Date,
    default: Date.now
  },
  processedAt: Date,
  processedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true
});

// Index for better query performance
scanSchema.index({ userId: 1, timestamp: -1 });
scanSchema.index({ adminId: 1, timestamp: -1 });
scanSchema.index({ status: 1, timestamp: -1 });

export default mongoose.model('Scan', scanSchema);