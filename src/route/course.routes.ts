import { Router } from 'express';


import { requireAuth } from '../middlewares/require-auth.js';
import { requireRole } from '../middlewares/require-role.js';
import { asyncHandler } from '../utils/async-handler.js';
import {
  createCourse,
  getPublishedCourses,
  getPublishedCourseBySlug,
  getMyCourses,
  updateCourseStatus,
} from '../controller/course.controller.js';

const courseRouter = Router();

courseRouter.get('/', asyncHandler(getPublishedCourses));

courseRouter.get(
  '/my-courses',
  requireAuth,
  requireRole('INSTRUCTOR', 'ADMIN'),
  asyncHandler(getMyCourses)
);

// Route to update course status (only accessible by ADMIN)
courseRouter.patch(
  '/:courseId/status',
  requireAuth,
  requireRole('ADMIN'),
  asyncHandler(updateCourseStatus)
);

courseRouter.get('/:slug', asyncHandler(getPublishedCourseBySlug));

courseRouter.post(
  '/',
  requireAuth,
  requireRole('INSTRUCTOR', 'ADMIN'),
  asyncHandler(createCourse)
);

export default courseRouter;
