import mongoose from 'mongoose';

const customerPOSchema = new mongoose.Schema({
  contractNo: {
    type: String,
    required: [true, 'Contract number is required'],
    unique: true,
    trim: true
  },
  poNo: {
    type: String,
    required: [true, 'PO number is required'],
    trim: true
  },
  customerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Customer',
    required: [true, 'Customer is required']
  },
  projectId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Project',
    required: [true, 'Project is required']
  },
  customerName: {
    type: String,
    trim: true
  },
  bookingEntity: {
    type: String,
    required: [true, 'Booking entity is required'],
    enum: ['Eviden', 'Habile', 'Akraya', 'ECIS'],
    trim: true
  },
  poCreationDate: {
    type: Date,
    required: [true, 'PO creation date is required']
  },
  poStartDate: {
    type: Date,
    required: [true, 'PO start date is required']
  },
  poValidityDate: {
    type: Date,
    required: [true, 'PO validity date is required']
  },
  poAmount: {
    type: Number,
    required: [true, 'PO amount is required'],
    min: [0.01, 'PO amount must be greater than 0']
  },
  poCurrency: {
    type: String,
    required: [true, 'Currency is required'],
    default: 'USD'
  },
  paymentTerms: {
    type: String,
    enum: ['Net 30', 'Net 45', 'Net 60', 'Net 90', 'Immediate', 'Custom'],
    default: 'Net 30'
  },
  autoRelease: {
    type: Boolean,
    default: false
  },
  status: {
    type: String,
    enum: ['Active', 'Closed', 'Expired'],
    default: 'Active'
  },
  notes: {
    type: String,
    trim: true
  }
}, {
  timestamps: true
});

// Indexes for performance
customerPOSchema.index({ customerId: 1 });
customerPOSchema.index({ projectId: 1 });
customerPOSchema.index({ contractNo: 1 });
customerPOSchema.index({ status: 1 });

// Validation: poStartDate <= poValidityDate
customerPOSchema.pre('save', function(next) {
  if (this.poStartDate && this.poValidityDate) {
    if (this.poStartDate > this.poValidityDate) {
      next(new Error('PO start date must be before or equal to PO validity date'));
      return;
    }
  }
  next();
});

const CustomerPO = mongoose.model('CustomerPO', customerPOSchema);

export default CustomerPO;
