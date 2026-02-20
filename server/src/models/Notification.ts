import mongoose from 'mongoose';

const notificationSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true
  },
  description: {
    type: String,
    required: true
  },
  type: {
    type: String,
    required: true,
    enum: [
      'leave',
      'ticket',
      'system',
      'announcement',
      'reminder',
      'celebration',
      'approval',
      'rejection'
    ]
  },
  isRead: {
    type: Boolean,
    default: false
  },
  userId: {
    type: String
    // Note: index removed - userId is indexed via compound indexes below
  },
  role: {
    type: String,
    required: true,
    enum: [
      'EMPLOYEE',
      'MANAGER',
      'HR',
      'IT_ADMIN',
      'IT_EMPLOYEE',
      'L1_APPROVER',
      'L2_APPROVER',
      'L3_APPROVER',
      'RMG',
      'FINANCE_ADMIN',
      'FACILITIES_ADMIN',
      'SUPER_ADMIN',
      'all'
    ]
    // Note: index removed - role is indexed via compound indexes below
  },
  meta: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  }
}, {
  timestamps: true
});

// Indexes for efficient queries
notificationSchema.index({ userId: 1, isRead: 1, createdAt: -1 });
notificationSchema.index({ role: 1, isRead: 1, createdAt: -1 });
notificationSchema.index({ createdAt: -1 });

// Virtual property to match frontend expectation of 'id'
notificationSchema.virtual('id').get(function () {
  return this._id.toHexString();
});

// Ensure virtuals are included when converting to JSON
notificationSchema.set('toJSON', {
  virtuals: true
});

export default mongoose.model('Notification', notificationSchema);
