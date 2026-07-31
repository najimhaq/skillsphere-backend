// src/controller/meCOntroller.ts
import express, { type Request, type Response } from 'express';

export const authController = async (req: Request, res: Response) => {
  const user = req.authUser;
  const session = req.authSession;

  if (!user || !session) {
    res.status(401).json({
      success: false,
      message: 'Authentication required',
    });
    return;
  }

  res.status(200).json({
    success: true,
    data: {
      user,
      session,
    },
  });
};


// {
//   "name": "Najimul Test",
//   "email": "najimul.test@example.com",
//   "password": "testpassword123"
// }
