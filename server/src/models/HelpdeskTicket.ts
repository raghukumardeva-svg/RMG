import mongoose from 'mongoose';

/**
 * Sub-Schemas for nested objects - ensures proper validation and type safety
 */

// Approval Level Sub-Schema
const approvalLevelSchema = new mongoose.Schema({
  level: {
    type: String,
    enum: ['L1', 'L2', 'L3'],
    required: true
  },
  approverId: {
    type: String,
    required: true
  },
  approverName: {
    type: String,
    required: true
  },
  approverEmail: {
    type: String,
    required: true,
    match: /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  },
  status: {
    type: String,
    enum: ['Approved', 'Rejected'],
    required: true
  },
  comments: {
    type: String,
    maxlength: 2000
  },
  timestamp: {
    type: Date,
    default: Date.now
  }
}, { _id: false });

// Progress Sub-Schema
const progressSchema = new mongoose.Schema({
  status: {
    type: String,
    enum: ['Not Started', 'In Progress', 'On Hold', 'Completed']
  },
  notes: {
    type: String,
    maxlength: 2000
  },
  lastUpdated: String
}, { _id: false });

// Resolution Sub-Schema
const resolutionSchema = new mongoose.Schema({
  resolvedBy: String,
  resolvedAt: String,
  notes: {
    type: String,
    maxlength: 5000
  }
}, { _id: false });

// Assignment Sub-Schema
const assignmentSchema = new mongoose.Schema({
  assignedToId: String,
  assignedToName: String,
  assignedTo: String, // Legacy field
  assignedBy: String,
  assignedByName: String,
  assignedByRole: {
    type: String,
    enum: ['IT_ADMIN', 'system']
  },
  assignedAt: String,
  assignmentNotes: {
    type: String,
    maxlength: 1000
  },
  queue: String
}, { _id: false });

// Conversation Message Sub-Schema
const conversationMessageSchema = new mongoose.Schema({
  sender: {
    type: String,
    enum: ['employee', 'manager', 'specialist', 'itadmin', 'system'],
    required: true
  },
  senderName: {
    type: String,
    required: true
  },
  message: {
    type: String,
    required: true,
    maxlength: 5000
  },
  timestamp: {
    type: String,
    required: true
  },
  attachments: [String],
  type: {
    type: String,
    enum: ['message', 'status_update', 'closing_note', 'approval_note']
  }
}, { _id: false });

// History Log Sub-Schema
const historyLogSchema = new mongoose.Schema({
  action: {
    type: String,
    required: true
  },
  timestamp: {
    type: String,
    required: true
  },
  by: {
    type: String,
    required: true
  },
  performedByRole: {
    type: String,
    enum: ['employee', 'manager', 'specialist', 'itadmin', 'system']
  },
  details: String,
  previousStatus: String,
  newStatus: String
}, { _id: false });

// SLA Sub-Schema
const slaSchema = new mongoose.Schema({
  approvalSlaHours: {
    type: Number,
    default: 24
  },
  processingSlaHours: {
    type: Number,
    default: 48
  },
  startAt: String,
  dueAt: String,
  approvalDeadline: String,
  processingDeadline: String,
  isOverdue: {
    type: Boolean,
    default: false
  },
  overdueBy: Number,
  status: {
    type: String,
    enum: ['On Track', 'At Risk', 'Overdue']
  }
}, { _id: false });

/**
 * Main Helpdesk Ticket Schema
 */
const helpdeskTicketSchema = new mongoose.Schema({
  ticketNumber: {
    type: String,
    required: true,
    unique: true // Unique already creates an index
  },
  id: String, // Legacy field for backward compatibility

  // Requester Information
  userId: {
    type: String,
    required: true
    // Note: index removed - userId is indexed via compound indexes below
  },
  userName: {
    type: String,
    required: true,
    minlength: 2,
    maxlength: 100
  },
  userEmail: {
    type: String,
    required: true,
    match: /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  },
  userDepartment: {
    type: String,
    maxlength: 100
  },

  // Ticket Classification - Module is immutable after creation
  highLevelCategory: {
    type: String,
    required: true,
    enum: ['IT', 'Facilities', 'Finance'],
    immutable: true // Cannot be changed after creation
    // Note: index removed - highLevelCategory is indexed via compound indexes below
  },
  module: {
    type: String,
    enum: ['IT', 'Facilities', 'Finance']
    // Virtual field mapped to highLevelCategory for API consistency
  },
  subCategory: {
    type: String,
    required: true,
    maxlength: 100
  },
  subject: {
    type: String,
    required: true,
    minlength: 5,
    maxlength: 200
  },
  description: {
    type: String,
    required: true,
    minlength: 10,
    maxlength: 10000 // Increased for rich text content
  },
  urgency: {
    type: String,
    enum: ['low', 'medium', 'high', 'critical'],
    default: 'medium',
    lowercase: true
  },

  // Status Management
  status: {
    type: String,
    enum: [
      'open',
      'pending',
      'in-progress',
      'resolved',
      'closed',
      'cancelled',
      'Reopened',
      'Pending Level-1 Approval',
      'Pending Level-2 Approval',
      'Pending Level-3 Approval',
      'Approved',
      'Rejected',
      'Cancelled',
      'Routed',
      'In Queue',
      'Assigned',
      'In Progress',
      'Paused',
      'On Hold',
      'Completed',
      'Confirmed',
      'Closed',
      'Auto-Closed'
    ],
    default: 'open'
    // Note: index removed - status is indexed via compound indexes below
  },

  // Approval Workflow Fields
  requiresApproval: {
    type: Boolean,
    default: false
  },
  currentApprovalLevel: {
    type: String,
    enum: ['L1', 'L2', 'L3', 'NONE'],
    default: 'NONE'
  },
  approvalLevel: {
    type: String,
    enum: ['L1', 'L2', 'L3', 'NONE'],
    default: 'NONE'
    // Alias for currentApprovalLevel for backward compatibility
  },
  approvalCompleted: {
    type: Boolean,
    default: false
  },
  approvalStatus: {
    type: String,
    enum: ['Pending', 'Approved', 'Rejected', 'Not Required'],
    default: 'Not Required'
  },
  approverHistory: [approvalLevelSchema],

  // Routing Information
  routedTo: {
    type: String,
    default: null,
    enum: [null, 'IT', 'Facilities', 'Finance']
    // CRITICAL: Controls IT Admin visibility
    // null = not routed yet (still in approval)
    // 'IT'/'Facilities'/'Finance' = routed to department
  },

  // Structured Sub-Documents
  progress: progressSchema,
  resolution: resolutionSchema,
  assignment: assignmentSchema,
  conversation: [conversationMessageSchema],
  history: [historyLogSchema],
  sla: slaSchema,

  // Attachments
  attachments: {
    type: [String],
    default: [],
    validate: {
      validator: function (arr: string[]) {
        return arr.length <= 10; // Max 10 attachments
      },
      message: 'Maximum 10 attachments allowed'
    }
  },

  // Completion & Closure
  userConfirmedAt: String,
  closedAt: String,
  closedBy: String,
  closingReason: {
    type: String,
    enum: ['Resolved', 'User Confirmed', 'Auto-Closed', 'User Cancellation']
  },
  closingNote: {
    type: String,
    maxlength: 2000
  },

  // Legacy fields for backward compatibility (will be deprecated)
  approval: mongoose.Schema.Types.Mixed,
  processing: mongoose.Schema.Types.Mixed
}, {
  timestamps: true,
  strict: true // IMPORTANT: Changed from false to true for data integrity
});

// Indexes for common queries
// Note: ticketNumber already has a unique index from 'unique: true' in schema
helpdeskTicketSchema.index({ userId: 1, status: 1 });
helpdeskTicketSchema.index({ status: 1, createdAt: -1 });
helpdeskTicketSchema.index({ highLevelCategory: 1, status: 1 });
helpdeskTicketSchema.index({ routedTo: 1, status: 1 });
helpdeskTicketSchema.index({ 'assignment.assignedToId': 1, status: 1 });

// Compound indexes for complex queries
helpdeskTicketSchema.index({ userId: 1, createdAt: -1 }); // User's tickets sorted by date
helpdeskTicketSchema.index({ requiresApproval: 1, currentApprovalLevel: 1, status: 1 }); // Approval queue
helpdeskTicketSchema.index({ createdAt: -1 }); // Recent tickets

// Department-specific indexes for optimal filtering performance
helpdeskTicketSchema.index({ module: 1, status: 1 }); // Filter by department (IT/Finance/Facilities) and status
helpdeskTicketSchema.index({ module: 1, requiresApproval: 1, approvalCompleted: 1 }); // Approval gating by department
helpdeskTicketSchema.index({ highLevelCategory: 1, routedTo: 1 }); // Department routing
helpdeskTicketSchema.index({ status: 1, urgency: 1, createdAt: -1 }); // Priority sorting within status

// Pre-save middleware to ensure data consistency
helpdeskTicketSchema.pre('save', function (next) {
  // Sync approvalLevel with currentApprovalLevel
  if (this.currentApprovalLevel) {
    this.approvalLevel = this.currentApprovalLevel;
  }

  // Sync module with highLevelCategory
  if (this.highLevelCategory && !this.module) {
    this.module = this.highLevelCategory;
  }

  next();
});

// Method to check if ticket can be cancelled
helpdeskTicketSchema.methods.canBeCancelled = function (): boolean {
  const nonCancellableStatuses = [
    'Cancelled',
    'Closed',
    'Auto-Closed',
    'Confirmed',
    'Rejected',
    'Completed',
    'Completed - Awaiting IT Closure'
  ];
  return !nonCancellableStatuses.includes(this.status);
};

// Method to check if ticket is overdue
helpdeskTicketSchema.methods.checkSLAStatus = function (): 'On Track' | 'At Risk' | 'Overdue' {
  if (!this.sla || !this.sla.dueAt) return 'On Track';

  const now = new Date();
  const dueDate = new Date(this.sla.dueAt);
  const hoursRemaining = (dueDate.getTime() - now.getTime()) / (1000 * 60 * 60);

  if (hoursRemaining < 0) {
    this.sla.isOverdue = true;
    this.sla.overdueBy = Math.abs(Math.round(hoursRemaining));
    return 'Overdue';
  } else if (hoursRemaining < 4) {
    return 'At Risk';
  }
  return 'On Track';
};

export default mongoose.model('HelpdeskTicket', helpdeskTicketSchema);
