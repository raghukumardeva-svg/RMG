import mongoose from 'mongoose';

const leaveSchema = new mongoose.Schema({
  employeeId: {
    type: String,
    required: true,
    index: true
  },
  employeeName: {
    type: String,
    required: true
  },
  leaveType: {
    type: String,
    required: true,
    enum: [
      'Earned Leave',
      'Sabbatical Leave',
      'Comp Off',
      'Paternity Leave',
      'Maternity Leave',
      'Sick Leave'
    ]
  },
  startDate: {
    type: Date,
    required: true
  },
  endDate: {
    type: Date,
    required: true
  },
  days: {
    type: Number,
    required: true,
    min: 0.5
  },
  isHalfDay: {
    type: Boolean,
    default: false
  },
  halfDayType: {
    type: String,
    enum: ['first_half', 'second_half', null],
    default: null
  },
  reason: String,
  justification: String,
  status: {
    type: String,
    required: true,
    enum: ['pending', 'approved', 'rejected', 'cancelled', 'in_review'],
    default: 'pending'
  },
  appliedOn: {
    type: Date,
    default: Date.now
  },
  approvedBy: String,
  approvedOn: {
    type: Date
  },
  rejectedBy: String,
  rejectedOn: {
    type: Date
  },
  rejectionReason: String,
  cancelledBy: String,
  cancelledOn: {
    type: Date
  },
  cancellationReason: String,
  remarks: String,
  managerId: {
    type: String,
    required: true
  },
  managerName: String,
  hrNotified: {
    type: Boolean,
    default: false
  },
  expiresAt: {
    type: Date,
    default: null
  },
  notes: String,
  attachments: [{
    fileName: String,
    url: String,
    type: {
      type: String,
      enum: ['medical', 'birth_certificate', 'justification']
    },
    uploadedAt: {
      type: Date,
      default: Date.now
    }
  }]
}, {
  timestamps: true
});

// Indexes for faster lookups
leaveSchema.index({ employeeId: 1, status: 1 });
leaveSchema.index({ status: 1, appliedOn: -1 });
leaveSchema.index({ managerId: 1, status: 1 });

// Virtual property to match frontend expectation of 'id'
leaveSchema.virtual('id').get(function() {
  return this._id.toHexString();
});

// Ensure virtuals are included when converting to JSON
leaveSchema.set('toJSON', {
  virtuals: true
});

export default mongoose.model('Leave', leaveSchema);
