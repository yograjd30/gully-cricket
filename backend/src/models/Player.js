import mongoose from 'mongoose';

const playerSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', index: true },
  name: { type: String, required: true, trim: true },
  nickname: { type: String, trim: true, default: '' },
  avatar: { type: String, default: '' }, // emoji or initials
  role: {
    type: String,
    enum: ['batsman', 'bowler', 'allrounder'],
    default: 'allrounder',
  },
  battingStyle: {
    type: String,
    enum: ['right', 'left'],
    default: 'right',
  },
  bowlingStyle: {
    type: String,
    enum: ['fast', 'medium', 'spin', 'none'],
    default: 'none',
  },
  isActive: { type: Boolean, default: true },
}, { timestamps: true });

playerSchema.index({ userId: 1, name: 1 });

export default mongoose.model('Player', playerSchema);
