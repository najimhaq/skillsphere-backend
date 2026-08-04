import { Router } from 'express';
import { requireAuth } from '../../middlewares/require-auth.js';
import { requireRole } from '../../middlewares/require-role.js';
import { getAdminCourses, reviewCourse } from '../../controller/admin/admin-course.controller.js';
import { asyncHandler } from '../../utils/async-handler.js';



const adminCourseRouter = Router();

adminCourseRouter.use(requireAuth, requireRole('ADMIN'));

adminCourseRouter.get('/', asyncHandler(getAdminCourses));

adminCourseRouter.patch('/:courseId/review', asyncHandler(reviewCourse));

export default adminCourseRouter;
