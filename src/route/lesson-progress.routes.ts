import { Router } from 'express';

import {
  getMyCourseProgress,
  markLessonAsComplete,
  markLessonAsIncomplete,
} from '../controller/lesson-progress.controller.js';
import { requireAuth } from '../middlewares/require-auth.js';
import { requireRole } from '../middlewares/require-role.js';
import { asyncHandler } from '../utils/async-handler.js';

const lessonProgressRouter = Router();

lessonProgressRouter.get(
  '/courses/:courseId',
  requireAuth,
  requireRole('STUDENT'),
  asyncHandler(getMyCourseProgress)
);

lessonProgressRouter.patch(
  '/lessons/:lessonId/complete',
  requireAuth,
  requireRole('STUDENT'),
  asyncHandler(markLessonAsComplete)
);

lessonProgressRouter.delete(
  '/lessons/:lessonId/complete',
  requireAuth,
  requireRole('STUDENT'),
  asyncHandler(markLessonAsIncomplete)
);

export default lessonProgressRouter;
