import mongoose from 'mongoose';

const teamSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', index: true },
  name: { type: String, required: true, trim: true },
  color: { type: String, default: '#A3E635' }, // hex color for scoreboard
  logo: { type: String, default: '🏏' }, // emoji or URL
  players: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Player',
  }],
  matchesPlayed: { type: Number, default: 0 },
  wins: { type: Number, default: 0 },
}, { timestamps: true });

export default mongoose.model('Team', teamSchema);
