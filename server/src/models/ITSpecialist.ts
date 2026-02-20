import mongoose, { Document, Schema } from 'mongoose';

export interface IITSpecialist extends Document {
  id: string;
  employeeId: string;
  name: string;
  email: string;
  role: 'IT_EMPLOYEE';
  specializations: string[];
  team: string;
  status: 'active' | 'inactive';
  activeTicketCount: number;
  maxCapacity: number;
  phone: string;
  designation: string;
  createdAt: Date;
  updatedAt: Date;
}

const ITSpecialistSchema = new Schema<IITSpecialist>(
  {
    employeeId: {
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
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    role: {
      type: String,
      enum: ['IT_EMPLOYEE'],
      default: 'IT_EMPLOYEE',
    },
    specializations: [{
      type: String,
      trim: true,
    }],
    team: {
      type: String,
      required: true,
      trim: true,
    },
    status: {
      type: String,
      enum: ['active', 'inactive'],
      default: 'active',
    },
    activeTicketCount: {
      type: Number,
      default: 0,
      min: 0,
    },
    maxCapacity: {
      type: Number,
      required: true,
      default: 5,
      min: 1,
    },
    phone: {
      type: String,
      trim: true,
    },
    designation: {
      type: String,
      required: true,
      trim: true,
    },
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform: function(_doc, ret: Record<string, unknown>) {
        ret.id = (ret._id as { toString: () => string }).toString();
        return ret;
      }
    },
    toObject: {
      virtuals: true,
      transform: function(_doc, ret: Record<string, unknown>) {
        ret.id = (ret._id as { toString: () => string }).toString();
        return ret;
      }
    }
  }
);

// Indexes for better query performance
// Note: employeeId and email already have unique indexes from 'unique: true' in schema
ITSpecialistSchema.index({ status: 1 });
ITSpecialistSchema.index({ specializations: 1 });

// Virtual for utilization percentage
ITSpecialistSchema.virtual('utilization').get(function() {
  return this.maxCapacity > 0 ? (this.activeTicketCount / this.maxCapacity) * 100 : 0;
});

export default mongoose.model<IITSpecialist>('ITSpecialist', ITSpecialistSchema);
