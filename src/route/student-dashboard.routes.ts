import { Router } from 'express';

import { getStudentDashboardOverview, uploadStudentProfileImage } from '../controller/student-dashboard.controller.js';
import { requireAuth } from '../middlewares/require-auth.js';
import {requireStudent } from '../middlewares/require-role.js';
import { asyncHandler } from '../utils/async-handler.js';
import { uploadProfileImage } from '../middlewares/upload-profile-image.js';

const studentDashboardRouter = Router();

studentDashboardRouter.get(
  '/overview',
  requireAuth,
  requireStudent,
  asyncHandler(getStudentDashboardOverview)
);

studentDashboardRouter.post(
  '/profile/image',
  requireAuth,
  requireStudent,
  uploadProfileImage.single('image'),
  asyncHandler(uploadStudentProfileImage)
);

export default studentDashboardRouter;
