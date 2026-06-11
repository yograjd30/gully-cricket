import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  googleId: { type: String, required: true, unique: true, index: true },
  displayName: { type: String, required: true, trim: true },
  email: { type: String, required: true, trim: true },
  avatar: { type: String, default: '' },
}, { timestamps: true });

export default mongoose.model('User', userSchema);
