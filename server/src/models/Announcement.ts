import mongoose from 'mongoose';

const pollOptionSchema = new mongoose.Schema({
  id: { type: String, required: true },
  text: { type: String, required: true },
  votes: { type: Number, default: 0 },
  votedBy: [{ type: String }]
}, { _id: false });

const reactionSchema = new mongoose.Schema({
  oderId: { type: String, required: true },
  userName: { type: String, required: true },
  emoji: { type: String, required: true },
  label: { type: String, required: true },
  timestamp: { type: String, required: true }
}, { _id: false });

const announcementSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String },
  content: { type: String },
  priority: { type: String, enum: ['low', 'medium', 'high', 'Low', 'Medium', 'High', 'Critical'], default: 'Medium' },
  category: { type: String, enum: ['General', 'HR', 'IT', 'Policy', 'Event', 'Urgent', 'general', 'hr', 'it', 'policy', 'event', 'urgent', 'celebration', 'announcement', 'feedback'], default: 'General' },
  author: { type: String },
  role: { type: String },
  publishedBy: { type: String },
  publishedOn: { type: String },
  date: { type: String },
  time: { type: String },
  avatar: { type: String },
  expiresOn: String,
  expiresAt: { type: String }, // Expiry date for announcements
  targetAudience: [String],
  attachments: [String],
  imageUrl: { type: String },
  likes: { type: Number, default: 0 },
  likedBy: [{ type: String }],
  isPinned: { type: Boolean, default: false },
  views: { type: Number, default: 0 },
  comments: [{
    id: Number,
    author: String,
    text: String,
    time: String
  }],
  reactions: [reactionSchema],
  // Poll specific fields
  isPoll: { type: Boolean, default: false },
  pollOptions: [pollOptionSchema],
  allowMultipleAnswers: { type: Boolean, default: false },
  isAnonymous: { type: Boolean, default: false },
  pollExpiresAt: { type: String },
  totalVotes: { type: Number, default: 0 }
}, { timestamps: true, strict: false }); // Set to false to allow frontend fields

export default mongoose.model('Announcement', announcementSchema);
