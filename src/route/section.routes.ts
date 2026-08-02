import { Router } from 'express';

import {
  deleteSection,
  updateSection,
} from '../controller/section.controller.js';
import { requireAuth } from '../middlewares/require-auth.js';
import { requireRole } from '../middlewares/require-role.js';
import { asyncHandler } from '../utils/async-handler.js';

const sectionRouter = Router();

sectionRouter.patch(
  '/:sectionId',
  requireAuth,
  requireRole('INSTRUCTOR', 'ADMIN'),
  asyncHandler(updateSection)
);

sectionRouter.delete(
  '/:sectionId',
  requireAuth,
  requireRole('INSTRUCTOR', 'ADMIN'),
  asyncHandler(deleteSection)
);

export default sectionRouter;
