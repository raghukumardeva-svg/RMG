import mongoose from 'mongoose';

// Approver information schema
const approverInfoSchema = new mongoose.Schema({
  employeeId: {
    type: String,
    required: true
  },
  name: {
    type: String,
    required: true
  },
  email: {
    type: String,
    required: true
  },
  designation: {
    type: String,
    default: ''
  }
}, { _id: false });

// Approval level configuration schema
const approvalLevelConfigSchema = new mongoose.Schema({
  enabled: {
    type: Boolean,
    default: false
  },
  approvers: {
    type: [approverInfoSchema],
    default: []
  }
}, { _id: false });

// Main approval configuration schema
const approvalConfigSchema = new mongoose.Schema({
  l1: {
    type: approvalLevelConfigSchema,
    default: () => ({ enabled: false, approvers: [] })
  },
  l2: {
    type: approvalLevelConfigSchema,
    default: () => ({ enabled: false, approvers: [] })
  },
  l3: {
    type: approvalLevelConfigSchema,
    default: () => ({ enabled: false, approvers: [] })
  }
}, { _id: false });

const subCategoryConfigSchema = new mongoose.Schema({
  highLevelCategory: {
    type: String,
    required: true,
    enum: ['IT', 'Facilities', 'Finance']
  },
  subCategory: {
    type: String,
    required: true
  },
  requiresApproval: {
    type: Boolean,
    default: false
  },
  processingQueue: {
    type: String,
    required: true
  },
  specialistQueue: {
    type: String,
    required: true
  },
  order: {
    type: Number,
    default: 999
  },
  isActive: {
    type: Boolean,
    default: true
  },
  // NEW: Approval Flow Configuration
  approvalConfig: {
    type: approvalConfigSchema,
    default: () => ({
      l1: { enabled: false, approvers: [] },
      l2: { enabled: false, approvers: [] },
      l3: { enabled: false, approvers: [] }
    })
  }
}, {
  timestamps: true
});

// Create compound index for efficient lookups
subCategoryConfigSchema.index({ highLevelCategory: 1, subCategory: 1 }, { unique: true });

export default mongoose.model('SubCategoryConfig', subCategoryConfigSchema);
