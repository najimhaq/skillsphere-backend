import { Router } from 'express';
import { requireAuth } from '../../middlewares/require-auth.js';
import { requireRole } from '../../middlewares/require-role.js';
import { getAdminOverview } from '../../controller/admin/admin.controller.js';
import { asyncHandler } from '../../utils/async-handler.js';



const adminRouter = Router();

adminRouter.use(requireAuth, requireRole('ADMIN'));

adminRouter.get('/overview', asyncHandler(getAdminOverview));

export default adminRouter;
