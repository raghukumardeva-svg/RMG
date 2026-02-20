import mongoose, { Schema, Document } from 'mongoose';

export interface IUDA extends Document {
    udaNumber: string;
    name: string;
    description: string;
    parentUDA: string;
    type: 'Billable' | 'Non-Billable';
    billable: 'Billable' | 'Non-Billable';
    projectRequired: 'Y' | 'N';
    active: 'Y' | 'N';
    createdAt: Date;
    updatedAt: Date;
}

const UDASchema: Schema = new Schema(
    {
        udaNumber: {
            type: String,
            required: true,
            unique: true,
            trim: true,
        },
        name: {
            type: String,
            required: true,
            trim: true,
        },
        description: {
            type: String,
            required: true,
            trim: true,
        },
        parentUDA: {
            type: String,
            default: '',
            trim: true,
        },
        type: {
            type: String,
            enum: ['Billable', 'Non-Billable'],
            required: true,
            default: 'Billable',
        },
        billable: {
            type: String,
            enum: ['Billable', 'Non-Billable'],
            required: true,
            default: 'Billable',
        },
        projectRequired: {
            type: String,
            enum: ['Y', 'N'],
            required: true,
            default: 'Y',
        },
        active: {
            type: String,
            enum: ['Y', 'N'],
            required: true,
            default: 'Y',
        },
    },
    {
        timestamps: true,
        collection: 'udas',
    }
);

// Create indexes for better query performance
UDASchema.index({ udaNumber: 1 });
UDASchema.index({ name: 1 });
UDASchema.index({ active: 1 });
UDASchema.index({ type: 1 });

export default mongoose.model<IUDA>('UDA', UDASchema);
