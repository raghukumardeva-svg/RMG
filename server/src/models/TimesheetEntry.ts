import mongoose, { Schema, Document } from 'mongoose';

/**
 * Date-based Timesheet Entry Model
 * Each entry represents a single task on a specific date
 * Replaces the week-based array structure for better:
 * - Billing: Query exact hours per project per date
 * - Approval: Managers approve/reject specific days
 * - Reporting: Date-wise analytics and insights
 */

export interface ITimesheetEntry extends Document {
    // Core identifying info
    employeeId: string;
    employeeName: string;
    date: Date; // The specific working date (YYYY-MM-DD)

    // Task details
    projectId: string; // Can be "N/A" for non-project tasks
    projectCode: string;
    projectName: string;
    udaId: string;
    udaName: string; // e.g., "Customer call", "Project Work", "Bench"
    type: string; // "Billable", "Non-Billable", "General"
    financialLineItem: string;
    billable: string; // "Billable" or "Non-Billable"

    // Time tracking
    hours: string; // e.g., "8:00", "4:30"
    comment: string | null;

    // Status tracking
    status: 'draft' | 'submitted' | 'approved' | 'rejected';
    submittedAt?: Date;

    // Approval workflow (for future manager approval feature)
    approvalStatus: 'pending' | 'approved' | 'rejected' | 'revision_requested';
    approvedBy?: string; // Manager's employeeId or email
    approvedAt?: Date;
    rejectedReason?: string;

    // Audit
    createdAt: Date;
    updatedAt: Date;
}

const TimesheetEntrySchema = new Schema<ITimesheetEntry>(
    {
        employeeId: { type: String, required: true, index: true },
        employeeName: { type: String, required: true },
        date: { type: Date, required: true, index: true },

        projectId: { type: String, required: true },
        projectCode: { type: String, required: true },
        projectName: { type: String, required: true },
        udaId: { type: String, required: true },
        udaName: { type: String, required: true },
        type: { type: String, required: true },
        financialLineItem: { type: String, required: true },
        billable: { type: String, required: true },

        hours: { type: String, required: true },
        comment: { type: String, default: null },

        status: {
            type: String,
            enum: ['draft', 'submitted', 'approved', 'rejected'],
            default: 'submitted',
            index: true
        },
        submittedAt: { type: Date },

        approvalStatus: {
            type: String,
            enum: ['pending', 'approved', 'rejected', 'revision_requested'],
            default: 'pending',
            index: true
        },
        approvedBy: { type: String },
        approvedAt: { type: Date },
        rejectedReason: { type: String },
    },
    {
        timestamps: true,
    }
);

// Compound indexes for efficient queries
TimesheetEntrySchema.index({ employeeId: 1, date: 1 });
TimesheetEntrySchema.index({ projectId: 1, date: 1 });
TimesheetEntrySchema.index({ approvalStatus: 1, submittedAt: 1 });
TimesheetEntrySchema.index({ billable: 1, date: 1 });

// Unique constraint: Prevent duplicate entries for same employee-date-project-uda
TimesheetEntrySchema.index(
    { employeeId: 1, date: 1, projectId: 1, udaId: 1 },
    { unique: true }
);

export default mongoose.model<ITimesheetEntry>('TimesheetEntry', TimesheetEntrySchema);
