//src/lib/auth.ts - backend
import { betterAuth } from 'better-auth';
import { mongodbAdapter } from '@better-auth/mongo-adapter';

import { client } from '../config/mongo-client.js';
import { env } from '../config/env.js';

export const auth = betterAuth({
  database: mongodbAdapter(client.db('skillsphere')),

  baseURL: env.BETTER_AUTH_URL,

  trustedOrigins: [env.FRONTEND_URL ?? 'http://localhost:3000'],

  emailAndPassword: {
    enabled: true,
  },

  user: {
    additionalFields: {
      role: {
        type: 'string',
        required: true,
        defaultValue: 'STUDENT',
        input: false,
      },
    },
  },
});
