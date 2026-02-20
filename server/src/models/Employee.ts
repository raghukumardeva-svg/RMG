import mongoose from 'mongoose';

const employeeSchema = new mongoose.Schema({
  employeeId: {
    type: String,
    required: true,
    unique: true
  },
  id: String, // Legacy field for backward compatibility
  name: {
    type: String,
    required: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  // Authentication fields
  password: {
    type: String,
    required: false, // Optional for employees without login access
    select: false // Don't include in queries by default
  },
  role: {
    type: String,
    required: true,
    enum: [
      'EMPLOYEE',      // Regular employee
      'MANAGER',       // Team manager
      'HR',            // HR personnel
      'RMG',           // Resource Management Group
      'IT_ADMIN',      // IT Administrator
      'IT_EMPLOYEE',   // IT Specialist/Support
      'L1_APPROVER',   // Level 1 Approver (Team Lead)
      'L2_APPROVER',   // Level 2 Approver (Manager)
      'L3_APPROVER',   // Level 3 Approver (Director)
      'SUPER_ADMIN',   // Super Admin - Full system access
    ],
    default: 'EMPLOYEE'
  },
  // Employee details
  phone: String,
  department: {
    type: String,
    required: true
  },
  designation: {
    type: String,
    required: true
  },
  dateOfJoining: String,
  reportingManager: mongoose.Schema.Types.Mixed,
  location: String,
  status: {
    type: String,
    enum: ['active', 'inactive', 'on-leave'],
    default: 'active'
  },
  avatar: String,
  profilePhoto: String, // Alias for avatar - used by frontend
  skills: [String],
  experience: Number,
  education: String,
  address: mongoose.Schema.Types.Mixed,
  emergencyContact: mongoose.Schema.Types.Mixed,
  // Access control
  isActive: {
    type: Boolean,
    default: true
  },
  hasLoginAccess: {
    type: Boolean,
    default: false // Only true if password is set and role requires login
  },
  // IT Specialist specific fields
  specializations: [String], // For IT_EMPLOYEE role
  team: String, // For IT_EMPLOYEE role
  activeTicketCount: {
    type: Number,
    default: 0
  },
  maxCapacity: {
    type: Number,
    default: 10
  },
  // Cost/Salary information for RMG Analytics
  monthlySalary: {
    type: Number,
    default: 0 // Monthly salary/cost per employee
  },
  hourlyRate: {
    type: Number,
    default: 0 // Calculated from monthly salary or set explicitly
  },
  currency: {
    type: String,
    default: 'INR'
  }
}, { timestamps: true, strict: true }); // Changed from false to true for data integrity

// Indexes for faster lookups
// Note: employeeId and email already have unique indexes from 'unique: true' in schema
employeeSchema.index({ department: 1, status: 1 });
employeeSchema.index({ role: 1 });
employeeSchema.index({ hasLoginAccess: 1, isActive: 1 });

// Delete the model if it already exists to allow re-compilation
if (mongoose.models.Employee) {
  delete mongoose.models.Employee;
}

export default mongoose.model('Employee', employeeSchema);
