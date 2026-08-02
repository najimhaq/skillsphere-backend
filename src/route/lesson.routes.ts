import { Router } from 'express';

import { requireAuth } from '../middlewares/require-auth.js';
import { requireRole } from '../middlewares/require-role.js';
import { asyncHandler } from '../utils/async-handler.js';
import { deleteLesson, updateLesson } from '../controller/lesson.controller.js';

const lessonRouter = Router();

lessonRouter.patch(
  '/:lessonId',
  requireAuth,
  requireRole('INSTRUCTOR', 'ADMIN'),
  asyncHandler(updateLesson)
);

lessonRouter.delete(
  '/:lessonId',
  requireAuth,
  requireRole('INSTRUCTOR', 'ADMIN'),
  asyncHandler(deleteLesson)
);

export default lessonRouter;
