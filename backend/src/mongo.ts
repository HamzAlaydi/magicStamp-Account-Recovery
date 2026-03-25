import mongoose from 'mongoose';
import { config } from './config';

export async function connectMongo(): Promise<void> {
  if (!config.mongo.uri) {
    throw new Error('MONGODB_URI is required');
  }

  if (mongoose.connection.readyState === 1) return;

  await mongoose.connect(config.mongo.uri, {
    serverSelectionTimeoutMS: 10000,
  });
}

