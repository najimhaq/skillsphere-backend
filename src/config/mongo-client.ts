import { MongoClient } from 'mongodb';

import { env } from './env.js';

const client = new MongoClient(env.MONGODB_URI);

export const connectMongoClient = async (): Promise<MongoClient> => {
  await client.connect();
  return client;
};

export { client };
