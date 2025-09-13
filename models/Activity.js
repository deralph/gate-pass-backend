// models/Activity.js
import mongoose from 'mongoose';

const activitySchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  action: {
    type: String,
    required: true
  },
  details: mongoose.Schema.Types.Mixed,
  timestamp: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Index for better query performance
activitySchema.index({ userId: 1, timestamp: -1 });
activitySchema.index({ action: 1, timestamp: -1 });

export default mongoose.model('Activity', activitySchema);