import express, { type Request, type Response } from 'express';

export const instructorTest = (req: Request, res: Response) => {
  res.status(200).json({
    success: true,
    message: `Welcome instructor ${req.authUser?.name}`,
  });
};


export const adminTest = (req: Request, res: Response) => {
  res.status(200).json({
    success: true,
    message: `Welcome admin ${req.authUser?.name}`,
  });
};
