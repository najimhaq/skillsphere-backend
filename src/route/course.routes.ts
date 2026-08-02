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
  updateCourse,
  deleteCourse,
  submitCourseForReview,
  getMyCourseById,
} from '../controller/course.controller.js';
import {
  createCourseSection,
  createLesson,
  getCourseContent,
} from '../controller/course-content.controller.js';

const courseRouter = Router();

courseRouter.get('/', asyncHandler(getPublishedCourses));

courseRouter.get(
  '/my-courses',
  requireAuth,
  requireRole('INSTRUCTOR', 'ADMIN'),
  asyncHandler(getMyCourses)
);

courseRouter.post(
  '/:courseId/submit-review',
  requireAuth,
  requireRole('INSTRUCTOR', 'ADMIN'),
  asyncHandler(submitCourseForReview)
);

// Route to update course status (only accessible by ADMIN)
courseRouter.patch(
  '/:courseId/status',
  requireAuth,
  requireRole('ADMIN'),
  asyncHandler(updateCourseStatus)
);

courseRouter.patch(
  '/:courseId',
  requireAuth,
  requireRole('INSTRUCTOR', 'ADMIN'),
  asyncHandler(updateCourse)
);

courseRouter.delete(
  '/:courseId',
  requireAuth,
  requireRole('INSTRUCTOR', 'ADMIN'),
  asyncHandler(deleteCourse)
);

courseRouter.get(
  '/my-courses/:courseId',
  requireAuth,
  requireRole('INSTRUCTOR', 'ADMIN'),
  asyncHandler(getMyCourseById)
);
//course content route
courseRouter.get(
  '/:courseId/content',
  requireAuth,
  requireRole('INSTRUCTOR', 'ADMIN'),
  asyncHandler(getCourseContent)
);

courseRouter.post(
  '/:courseId/sections',
  requireAuth,
  requireRole('INSTRUCTOR', 'ADMIN'),
  asyncHandler(createCourseSection)
);

courseRouter.post(
  '/sections/:sectionId/lessons',
  requireAuth,
  requireRole('INSTRUCTOR', 'ADMIN'),
  asyncHandler(createLesson)
);

courseRouter.get('/:slug', asyncHandler(getPublishedCourseBySlug));

courseRouter.post(
  '/',
  requireAuth,
  requireRole('INSTRUCTOR', 'ADMIN'),
  asyncHandler(createCourse)
);

export default courseRouter;
