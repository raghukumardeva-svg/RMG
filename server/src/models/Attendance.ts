import mongoose from 'mongoose';

const attendanceSchema = new mongoose.Schema({
  employeeId: { type: String, required: true },
  date: { type: String, required: true },
  status: { type: String, enum: ['Present', 'Absent', 'Late', 'Half Day', 'Leave', 'Holiday', 'Weekend'], required: true },
  checkIn: String,
  checkOut: String,
  workHours: Number,
  notes: String,
}, { timestamps: true, strict: true }); // Changed from false to true for data integrity

export default mongoose.model('Attendance', attendanceSchema);
