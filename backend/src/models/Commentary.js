import mongoose from 'mongoose';

const commentarySchema = new mongoose.Schema({
  matchId: { type: mongoose.Schema.Types.ObjectId, ref: 'Match', required: true, index: true },
  ballRef: {
    inningsIndex: { type: Number, required: true },
    ballIndex: { type: Number, required: true },
  },
  text: { type: String, required: true },
  type: { type: String, enum: ['ai', 'template'], default: 'template' },
}, { timestamps: true });

export default mongoose.model('Commentary', commentarySchema);
