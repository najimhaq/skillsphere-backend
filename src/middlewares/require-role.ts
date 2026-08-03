//src/middlewares/require-role.ts
import type { NextFunction, Request, Response } from 'express';

import type { UserRole } from '../types/auth.js';

export const requireRole = (...allowedRoles: UserRole[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.authUser) {
      res.status(401).json({
        success: false,
        message: 'Authentication required',
      });
      return;
    }

    if (!allowedRoles.includes(req.authUser.role)) {
      res.status(403).json({
        success: false,
        message: 'You do not have permission for this action',
      });
      return;
    }

    next();
  };
};

export const requireAdmin = requireRole('ADMIN');
