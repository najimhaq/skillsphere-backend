import { Router } from 'express';
import { requireAuth } from '../../middlewares/require-auth.js';
import { requireAdmin } from '../../middlewares/require-role.js';
import { asyncHandler } from '../../utils/async-handler.js';
import { getAdminCourses, reviewCourse } from '../../controller/admin/admin-course.controller.js';
import { getAdminCourseById } from '../../controller/admin/admin-course-detail.controller.js';



const adminCourseRouter = Router();

adminCourseRouter.use(requireAuth, requireAdmin);

adminCourseRouter.get('/', asyncHandler(getAdminCourses));

adminCourseRouter.get('/:courseId', asyncHandler(getAdminCourseById));

adminCourseRouter.patch('/:courseId/review', asyncHandler(reviewCourse));

export default adminCourseRouter;
