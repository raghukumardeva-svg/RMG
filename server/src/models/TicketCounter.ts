import mongoose, { Model } from 'mongoose';

interface ITicketCounter {
  _id: string;
  sequence: number;
}

interface ITicketCounterModel extends Model<ITicketCounter> {
  getNextSequence(): Promise<string>;
}

/**
 * Ticket Counter Model
 * Ensures atomic ticket number generation to prevent race conditions
 */
const ticketCounterSchema = new mongoose.Schema<ITicketCounter>({
  _id: {
    type: String,
    required: true,
    default: 'ticketNumber'
  },
  sequence: {
    type: Number,
    required: true,
    default: 0
  }
}, { timestamps: true });

/**
 * Get next ticket number atomically
 * Uses MongoDB's findOneAndUpdate with upsert to ensure thread-safety
 */
ticketCounterSchema.statics.getNextSequence = async function(): Promise<string> {
  const counter = await this.findOneAndUpdate(
    { _id: 'ticketNumber' },
    { $inc: { sequence: 1 } },
    {
      new: true,
      upsert: true,
      setDefaultsOnInsert: true
    }
  );

  if (!counter) {
    throw new Error('Failed to generate ticket number');
  }

  // Format: TKT0001, TKT0002, etc.
  return `TKT${String(counter.sequence).padStart(4, '0')}`;
};

export default mongoose.model<ITicketCounter, ITicketCounterModel>('TicketCounter', ticketCounterSchema);
