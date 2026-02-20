import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  password: {
    type: String,
    required: true
  },
  name: {
    type: String,
    required: true
  },
  role: {
    type: String,
    required: true,
    enum: [
      'EMPLOYEE', 
      'HR', 
      'RMG', 
      'MANAGER', 
      'IT_ADMIN',
      'FINANCE_ADMIN',
      'FACILITIES_ADMIN',
      'IT_EMPLOYEE',
      'L1_APPROVER',
      'L2_APPROVER',
      'L3_APPROVER',
      'SUPER_ADMIN',
      'admin', 
      'employee', 
      'manager', 
      'hr'
    ]
  },
  department: String,
  designation: String,
  employeeId: {
    type: String,
    unique: true,
    sparse: true
  },
  avatar: String,
  isActive: {
    type: Boolean,
    default: true
  },
}, { timestamps: true, strict: false });

// Index for faster lookups
userSchema.index({ email: 1 });
userSchema.index({ employeeId: 1 });

export default mongoose.model('User', userSchema);
