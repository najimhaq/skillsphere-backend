import { Router } from 'express';

import { getStudentDashboardOverview } from '../controller/student-dashboard.controller.js';
import { requireAuth } from '../middlewares/require-auth.js';
import { requireRole } from '../middlewares/require-role.js';
import { asyncHandler } from '../utils/async-handler.js';

const studentDashboardRouter = Router();

studentDashboardRouter.get(
  '/overview',
  requireAuth,
  requireRole('STUDENT'),
  asyncHandler(getStudentDashboardOverview)
);

export default studentDashboardRouter;
