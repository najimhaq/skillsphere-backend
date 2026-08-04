import { Router } from 'express';
import { requireAuth } from '../../middlewares/require-auth.js';
import { requireRole } from '../../middlewares/require-role.js';
import { getAdminUsers, updateAdminUserAccountStatus, updateAdminUserRole } from '../../controller/admin/admin-user.controller.js';
import { asyncHandler } from '../../utils/async-handler.js';



const adminUserRouter = Router();

adminUserRouter.use(requireAuth, requireRole('ADMIN'));

adminUserRouter.get('/', asyncHandler(getAdminUsers));

adminUserRouter.patch('/:userId/role', asyncHandler(updateAdminUserRole));

adminUserRouter.patch(
  '/:userId/account-status',
  asyncHandler(updateAdminUserAccountStatus)
);

export default adminUserRouter;
