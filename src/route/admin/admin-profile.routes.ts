import { Router } from 'express';

import {
  getAdminProfile,
  updateAdminProfile,
  uploadAdminProfileImage,
} from '../../controller/admin/admin-profile.controller.js';
import { requireAuth } from '../../middlewares/require-auth.js';
import { requireRole } from '../../middlewares/require-role.js';
import { uploadProfileImage } from '../../middlewares/upload-profile-image.js';
import { asyncHandler } from '../../utils/async-handler.js';

const adminProfileRouter = Router();

adminProfileRouter.use(requireAuth, requireRole('ADMIN'));

adminProfileRouter.get('/', asyncHandler(getAdminProfile));

adminProfileRouter.patch('/', asyncHandler(updateAdminProfile));

adminProfileRouter.post(
  '/image',
  uploadProfileImage.single('image'),
  asyncHandler(uploadAdminProfileImage)
);

export default adminProfileRouter;
