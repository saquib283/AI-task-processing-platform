import mongoose from 'mongoose';
import { config } from './index';

export async function connectDatabase(): Promise<void> {
  try {
    await mongoose.connect(config.mongodb.uri);
    console.log('MongoDB connected successfully');
  } catch (error) {
    console.error('MongoDB connection failed:', error);
    process.exit(1);
  }

  mongoose.connection.on('error', (err) => {
    console.error('MongoDB connection error:', err);
  });

  mongoose.connection.on('disconnected', () => {
    console.warn('MongoDB disconnected. Attempting reconnection...');
  });
}
