import mongoose from 'mongoose';

const connectDB = async () => {
  let uri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/gully-cricket-hq';
  const isPlaceholder = uri.includes('<cluster>') || uri.includes('<user>') || uri.includes('<password>');
  if (isPlaceholder) {
    console.warn('Configured MONGODB_URI is a placeholder. Defaulting to local MongoDB.');
    uri = 'mongodb://127.0.0.1:27017/gully-cricket-hq';
  }
  try {
    const conn = await mongoose.connect(uri);
    console.log(`MongoDB connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`MongoDB connection error: ${error.message}`);
    const localUri = 'mongodb://127.0.0.1:27017/gully-cricket-hq';
    if (uri !== localUri) {
      console.warn(`Attempting fallback to local MongoDB: ${localUri}`);
      try {
        await mongoose.disconnect();
        const conn = await mongoose.connect(localUri);
        console.log(`MongoDB connected (local): ${conn.connection.host}`);
        return;
      } catch (err) {
        console.error(`Local MongoDB connection failed: ${err.message}`);
      }
    }
    process.exit(1);
  }
};

mongoose.connection.on('disconnected', () => {
  console.warn('MongoDB disconnected. Attempting reconnect...');
});

mongoose.connection.on('error', (err) => {
  console.error(`MongoDB error: ${err.message}`);
});

export default connectDB;
