import { Router } from 'express';
import { requireAuth } from '../middlewares/require-auth.js';
import { asyncHandler } from '../utils/async-handler.js';
import {
  enrollInCourse,
  getMyEnrollments,
} from '../controller/enrollment.controller.js';

const enrollmentRouter = Router();
enrollmentRouter.get(
  '/my-enrollments',
  requireAuth,
  asyncHandler(getMyEnrollments)
);

enrollmentRouter.post(
  '/courses/:courseId/enroll',
  requireAuth,
  asyncHandler(enrollInCourse)
);

export default enrollmentRouter;
