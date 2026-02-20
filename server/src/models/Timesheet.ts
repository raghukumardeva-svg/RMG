import mongoose, { Schema, Document } from 'mongoose';

export interface ITimesheetRow {
    projectId: string;
    projectCode: string;
    projectName: string;
    udaId: string;
    udaName: string;
    type?: string;
    financialLineItem: string;
    billable: string;
    hours: (string | null)[];
    comments: (string | null)[];
}

export interface ITimesheet extends Document {
    employeeId: string;
    employeeName: string;
    weekStartDate: Date;
    weekEndDate: Date;
    rows: ITimesheetRow[];
    status: 'draft' | 'submitted' | 'approved' | 'rejected';
    submittedAt?: Date;
    approvedAt?: Date;
    approvedBy?: string;
    rejectedAt?: Date;
    rejectedBy?: string;
    rejectionReason?: string;
    totalHours: number;
    createdAt: Date;
    updatedAt: Date;
}

const TimesheetRowSchema = new Schema({
    projectId: { type: String, required: true },
    projectCode: { type: String, required: true },
    projectName: { type: String, required: true },
    udaId: { type: String, required: true },
    udaName: { type: String, required: true },
    type: { type: String },
    financialLineItem: { type: String, required: true },
    billable: { type: String, required: true },
    hours: [{ type: String }],
    comments: [{ type: String }],
});

const TimesheetSchema = new Schema<ITimesheet>(
    {
        employeeId: { type: String, required: true },
        employeeName: { type: String, required: true },
        weekStartDate: { type: Date, required: true },
        weekEndDate: { type: Date, required: true },
        rows: [TimesheetRowSchema],
        status: {
            type: String,
            enum: ['draft', 'submitted', 'approved', 'rejected'],
            default: 'draft'
            // Note: Single-field indexes removed - using compound indexes below for better query performance
        },
        submittedAt: { type: Date },
        approvedAt: { type: Date },
        approvedBy: { type: String },
        rejectedAt: { type: Date },
        rejectedBy: { type: String },
        rejectionReason: { type: String },
        totalHours: { type: Number, default: 0 },
    },
    {
        timestamps: true,
    }
);

// Compound index for finding timesheet by employee and week
TimesheetSchema.index({ employeeId: 1, weekStartDate: 1 });

export default mongoose.model<ITimesheet>('Timesheet', TimesheetSchema);
