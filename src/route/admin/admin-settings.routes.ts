import { Router } from 'express';

import {
  getAdminSettings,
  updateAdminSettings,
} from '../../controller/admin/admin-settings.controller.js';
import { requireAuth } from '../../middlewares/require-auth.js';
import { requireRole } from '../../middlewares/require-role.js';
import { asyncHandler } from '../../utils/async-handler.js';

const adminSettingsRouter = Router();

adminSettingsRouter.use(requireAuth, requireRole('ADMIN'));

adminSettingsRouter.get('/', asyncHandler(getAdminSettings));

adminSettingsRouter.patch('/', asyncHandler(updateAdminSettings));

export default adminSettingsRouter;
