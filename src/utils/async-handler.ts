// src/utils/async-handler.ts
// কোনো error হলে Express সবসময় properly ধরবে না
//example - router.post("/", asyncHandler(createCourse));
import type { NextFunction, Request, RequestHandler, Response } from 'express';

export const asyncHandler = (
  handler: (req: Request, res: Response, next: NextFunction) => Promise<void>
): RequestHandler => {
  return (req, res, next) => {
    void Promise.resolve(handler(req, res, next)).catch(next);
  };
};
