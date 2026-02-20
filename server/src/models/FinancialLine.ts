import mongoose from 'mongoose';

const revenuePlanningSchema = new mongoose.Schema({
  month: {
    type: String,
    required: true
  },
  plannedUnits: {
    type: Number,
    default: 0,
    min: 0
  },
  plannedRevenue: {
    type: Number,
    default: 0,
    min: 0
  },
  actualUnits: {
    type: Number,
    default: 0,
    min: 0
  },
  forecastedUnits: {
    type: Number,
    default: 0,
    min: 0
  },
  variance: {
    type: Number,
    default: 0
  }
}, { _id: false });

const paymentMilestoneSchema = new mongoose.Schema({
  milestoneName: {
    type: String,
    required: [true, 'Milestone name is required'],
    trim: true
  },
  milestoneAmount: {
    type: Number,
    required: [true, 'Milestone amount is required'],
    min: [0.01, 'Milestone amount must be greater than 0']
  },
  dueDate: {
    type: Date,
    required: [true, 'Due date is required']
  },
  status: {
    type: String,
    enum: ['Pending', 'Paid'],
    default: 'Pending'
  }
}, { _id: false });

const financialLineSchema = new mongoose.Schema({
  flNo: {
    type: String,
    required: [true, 'FL number is required'],
    unique: true,
    trim: true
  },
  flName: {
    type: String,
    required: [true, 'FL name is required'],
    maxlength: [150, 'FL name cannot exceed 150 characters'],
    trim: true
  },
  projectId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Project',
    required: [true, 'Project is required']
  },
  contractType: {
    type: String,
    required: [true, 'Contract type is required'],
    trim: true
  },
  locationType: {
    type: String,
    required: [true, 'Location type is required'],
    enum: ['Onsite', 'Offshore', 'Hybrid']
  },
  executionEntity: {
    type: String,
    required: [true, 'Execution entity is required'],
    trim: true
  },
  timesheetApprover: {
    type: String,
    required: [true, 'Timesheet approver is required'],
    trim: true
  },
  scheduleStart: {
    type: Date,
    required: [true, 'Schedule start date is required']
  },
  scheduleEnd: {
    type: Date,
    required: [true, 'Schedule end date is required']
  },
  currency: {
    type: String,
    required: [true, 'Currency is required'],
    default: 'USD'
  },
  // Step 2: Funding Details
  customerPOId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'CustomerPO',
    required: [true, 'Customer PO is required']
  },
  poNo: {
    type: String,
    trim: true
  },
  contractNo: {
    type: String,
    trim: true
  },
  unitRate: {
    type: Number,
    required: [true, 'Unit rate is required'],
    min: [0.01, 'Unit rate must be greater than 0']
  },
  fundingUnits: {
    type: Number,
    required: [true, 'Funding units is required'],
    min: [0.01, 'Funding units must be greater than 0']
  },
  unitUOM: {
    type: String,
    required: [true, 'Unit of measure is required'],
    enum: ['Hour', 'Day', 'Month']
  },
  fundingValue: {
    type: Number,
    required: [true, 'Funding value is required'],
    min: 0
  },
  // Step 3: Revenue Planning
  revenuePlanning: [revenuePlanningSchema],
  // Step 4: Payment Milestones
  paymentMilestones: [paymentMilestoneSchema],
  // Status
  status: {
    type: String,
    enum: ['Draft', 'Active', 'On Hold', 'Closed', 'Completed'],
    default: 'Draft'
  },
  notes: {
    type: String,
    trim: true
  }
}, {
  timestamps: true
});

// Indexes for performance
financialLineSchema.index({ projectId: 1 });
financialLineSchema.index({ customerPOId: 1 });
financialLineSchema.index({ flNo: 1 });
financialLineSchema.index({ status: 1 });

// Pre-save validation: scheduleStart < scheduleEnd
financialLineSchema.pre('save', function(next) {
  if (this.scheduleStart && this.scheduleEnd) {
    if (this.scheduleStart >= this.scheduleEnd) {
      next(new Error('Schedule start date must be before schedule end date'));
      return;
    }
  }
  
  // Calculate fundingValue if not set
  if (this.unitRate && this.fundingUnits && !this.fundingValue) {
    this.fundingValue = this.unitRate * this.fundingUnits;
  }
  
  next();
});

const FinancialLine = mongoose.model('FinancialLine', financialLineSchema);

export default FinancialLine;
