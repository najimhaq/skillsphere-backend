import { Router } from 'express';

import { getEnrolledCourseLearningContent } from '../controller/student-learning.controller.js';
import { requireAuth } from '../middlewares/require-auth.js';
import { requireRole } from '../middlewares/require-role.js';
import { asyncHandler } from '../utils/async-handler.js';

const studentLearningRouter = Router();

studentLearningRouter.get(
  '/courses/:courseId',
  requireAuth,
  requireRole('STUDENT'),
  asyncHandler(getEnrolledCourseLearningContent)
);

export default studentLearningRouter;
