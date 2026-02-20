import mongoose from 'mongoose';

const newJoinerSchema = new mongoose.Schema({
  employeeId: String,
  name: String,
  designation: String,
  department: String,
  joiningDate: String,
  avatar: String,
}, { timestamps: true, strict: false });

export default mongoose.model('NewJoiner', newJoinerSchema);
