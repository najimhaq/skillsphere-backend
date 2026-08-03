import type { AuthenticatedSession, AuthenticatedUser } from './auth.js';

declare global {
  namespace Express {
    interface Request {
      authUser?: AuthenticatedUser;
      authSession?: AuthenticatedSession;
    }
  }
}

export {};
