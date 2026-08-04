import { Router } from 'express';

import {
  exportAdminActivityLogsCsv,
  getAdminActivityLogs,
} from '../../controller/admin/admin-activity-log.controller.js';
import { requireAuth } from '../../middlewares/require-auth.js';
import { requireRole } from '../../middlewares/require-role.js';
import { asyncHandler } from '../../utils/async-handler.js';

const adminActivityLogRouter = Router();

adminActivityLogRouter.use(requireAuth, requireRole('ADMIN'));

adminActivityLogRouter.get('/export', asyncHandler(exportAdminActivityLogsCsv));

adminActivityLogRouter.get('/', asyncHandler(getAdminActivityLogs));

export default adminActivityLogRouter;
