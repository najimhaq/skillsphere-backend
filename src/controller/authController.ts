// src/controller/meCOntroller.ts
import express, { type Request, type Response } from 'express';
import { fromNodeHeaders } from 'better-auth/node';
import { auth } from '../lib/auth.js';

export const authController = async (req: Request, res: Response) => {
  const session = await auth.api.getSession({
    headers: fromNodeHeaders(req.headers),
  });

  if (!session?.user) {
    res.status(401).json({
      success: false,
      message: 'Unauthorized',
    });
    return;
  }

  res.status(200).json({
    // এখন response-এ session token, IP address, user agent-এর মতো sensitive বা অপ্রয়োজনীয় তথ্য যাবে না।
    success: true,
    data: {
      user: {
        id: session.user.id,
        name: session.user.name,
        email: session.user.email,
        emailVerified: session.user.emailVerified,
      },
      session: {
        id: session.session.id,
        expiresAt: session.session.expiresAt,
      },
    },
  });
};
