import mongoose from 'mongoose';

const holidaySchema = new mongoose.Schema({
  name: { type: String, required: true },
  date: { type: String, required: true },
  type: { type: String, enum: ['National', 'Regional', 'Company', 'Optional', 'Public Holiday', 'Company Holiday', 'Floating Holiday'], required: true },
  description: String,
  backgroundImage: { type: String, default: '' }, // URL or base64 image for holiday background
}, { timestamps: true, strict: true }); // Changed from false to true for data integrity

export default mongoose.model('Holiday', holidaySchema);
