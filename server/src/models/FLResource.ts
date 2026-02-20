import mongoose from 'mongoose';

const flResourceSchema = new mongoose.Schema({
    employeeId: {
        type: String,
        required: true,
        index: true
    },
    resourceName: {
        type: String,
        required: true
    },
    jobRole: {
        type: String
    },
    department: {
        type: String
    },
    skills: [{
        type: String
    }],
    utilizationPercentage: {
        type: Number,
        min: 0,
        max: 100
    },
    requestedFromDate: {
        type: Date
    },
    requestedToDate: {
        type: Date
    },
    billable: {
        type: Boolean,
        default: true
    },
    percentageBasis: {
        type: String
    },
    monthlyAllocations: [{
        month: String,
        allocation: Number
    }],
    totalAllocation: {
        type: String
    },
    financialLineId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'FinancialLine'
    },
    flNo: {
        type: String
    },
    flName: {
        type: String
    },
    projectId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Project',
        required: true,
        index: true
    },
    status: {
        type: String,
        enum: ['Active', 'Inactive', 'Completed'],
        default: 'Active'
    },
    allocation: {
        type: Number,
        min: 0,
        max: 100
    },
    startDate: {
        type: Date
    },
    endDate: {
        type: Date
    },
    role: {
        type: String
    }
}, {
    timestamps: true,
    collection: 'flresources' // explicitly set collection name
});

// Create compound index for efficient lookups
flResourceSchema.index({ employeeId: 1, projectId: 1 });

export default mongoose.model('FLResource', flResourceSchema);
