import { betterAuth } from 'better-auth';
import { mongodbAdapter } from '@better-auth/mongo-adapter';

import { client } from '../config/mongo-client.js';
import { env } from '../config/env.js';

export const auth = betterAuth({
  database: mongodbAdapter(client.db('skillsphere')),

  // Backend URL, কারণ Better Auth backend-এই OAuth callback handle করবে
  baseURL: env.BETTER_AUTH_URL,

  trustedOrigins: [env.FRONTEND_URL ?? 'http://localhost:3000'],

  emailAndPassword: {
    enabled: true,
  },

  socialProviders: {
    google: {
      clientId: env.GOOGLE_CLIENT_ID,
      clientSecret: env.GOOGLE_CLIENT_SECRET,
    },
  },

  user: {
    additionalFields: {
      role: {
        type: 'string',
        required: true,
        defaultValue: 'STUDENT',
        input: false,
      },

      accountStatus: {
        type: 'string',
        required: true,
        defaultValue: 'ACTIVE',
        input: false,
      },
    },
  },
});
