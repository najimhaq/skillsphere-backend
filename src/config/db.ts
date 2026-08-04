import mongoose from 'mongoose';

import { env } from './env.js';

export const connectDatabase = async (): Promise<void> => {
  try {
    const connection = await mongoose.connect(env.MONGODB_URI);

    console.log(
      `MongoDB connected: ${connection.connection.host}/${connection.connection.name}`
    );
  } catch (error: unknown) {
    const message =
      error instanceof Error
        ? error.message
        : 'Unknown database connection error';

    console.error(`MongoDB connection failed: ${message}`);
    process.exit(1);
  }
};

export const getDb = () => {
  if (mongoose.connection.readyState !== 1 || !mongoose.connection.db) {
    throw new Error('MongoDB database connection is not ready.');
  }

  return mongoose.connection.db;
};
