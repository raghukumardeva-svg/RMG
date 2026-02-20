import mongoose from 'mongoose';

const ctcHistorySchema = new mongoose.Schema({
    actualCTC: {
        type: Number,
        required: true
    },
    fromDate: {
        type: String,
        required: true
    },
    toDate: {
        type: String,
        required: true
    },
    currency: {
        type: String,
        enum: ['INR', 'USD'],
        required: true
    },
    uom: {
        type: String,
        enum: ['Annual', 'Monthly'],
        required: true
    }
}, { _id: false });

const ctcMasterSchema = new mongoose.Schema({
    employeeId: {
        type: String,
        required: true,
        unique: true
    },
    employeeName: {
        type: String,
        required: true
    },
    employeeEmail: {
        type: String,
        required: true
    },
    latestAnnualCTC: {
        type: Number,
        required: true,
        default: 0
    },
    latestActualCurrency: {
        type: String,
        enum: ['INR', 'USD'],
        required: true,
        default: 'INR'
    },
    latestActualUOM: {
        type: String,
        enum: ['Annual', 'Monthly'],
        required: true,
        default: 'Annual'
    },
    latestPlannedCTC: {
        type: Number,
        required: true,
        default: 0
    },
    currency: {
        type: String,
        enum: ['INR', 'USD'],
        required: true,
        default: 'INR'
    },
    uom: {
        type: String,
        enum: ['Annual', 'Monthly'],
        required: true,
        default: 'Annual'
    },
    ctcHistory: [ctcHistorySchema]
}, {
    timestamps: true
});

// Index for faster queries
ctcMasterSchema.index({ employeeId: 1 });
ctcMasterSchema.index({ employeeName: 1 });
ctcMasterSchema.index({ currency: 1 });

const CTCMaster = mongoose.model('CTCMaster', ctcMasterSchema);

export default CTCMaster;
