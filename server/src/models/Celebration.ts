import mongoose from 'mongoose';

const celebrationSchema = new mongoose.Schema({
  type: { type: String, enum: ['Birthday', 'Anniversary', 'Achievement', 'Promotion', 'New Joiner'], required: true },
  employeeId: { type: String, required: true },
  name: { type: String, required: true },
  date: { type: String, required: true },
  message: String,
  avatar: String,
}, { timestamps: true, strict: true }); // Changed from false to true for data integrity

export default mongoose.model('Celebration', celebrationSchema);
