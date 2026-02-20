import mongoose from 'mongoose';

const allocationSchema = new mongoose.Schema({
  employeeId: {
    type: String,
    required: true,
    index: true
  },
  projectId: {
    type: String,
    required: true,
    index: true
  },
  allocation: {
    type: Number,
    required: true,
    min: 0,
    max: 100
  },
  startDate: {
    type: Date,
    required: true
  },
  endDate: {
    type: Date
  },
  role: {
    type: String
  },
  billable: {
    type: Boolean,
    default: true
  },
  status: {
    type: String,
    enum: ['active', 'completed', 'cancelled'],
    default: 'active'
  },
  remarks: {
    type: String
  }
}, {
  timestamps: true
});

// Create compound index for efficient lookups
allocationSchema.index({ employeeId: 1, projectId: 1 });
allocationSchema.index({ status: 1 });

export default mongoose.model('Allocation', allocationSchema);
