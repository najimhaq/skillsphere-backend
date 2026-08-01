// src/middlewares/require-auth.ts
import type { NextFunction, Request, Response } from 'express';
import { fromNodeHeaders } from 'better-auth/node';

import { auth } from '../lib/auth.js';
import { isUserRole } from '../types/auth.js';

export const requireAuth = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // console.log('Incoming cookie:', req.headers.cookie);
    // console.log('Incoming origin:', req.headers.origin);
    const session = await auth.api.getSession({
      headers: fromNodeHeaders(req.headers),
    });

    if (!session?.user) {
      res.status(401).json({
        success: false,
        message: 'Authentication required',
      });
      return;
    }

    if (!isUserRole(session.user.role)) {
      res.status(403).json({
        success: false,
        message: 'Invalid user role',
      });
      return;
    }

    req.authUser = {
      id: session.user.id,
      name: session.user.name,
      email: session.user.email,
      emailVerified: session.user.emailVerified,
      role: session.user.role,
    };

    req.authSession = {
      id: session.session.id,
      expiresAt: session.session.expiresAt,
    };

    next();
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : 'Authentication failed';

    console.error(`Authentication middleware error: ${message}`);

    res.status(401).json({
      success: false,
      message: 'Invalid or expired session',
    });
  }
};
