import { Router } from 'express';

import {
  getMyCourseCertificate,
  issueMyCertificate,
  verifyCertificate,
} from '../controller/certificate.controller.js';
import { requireAuth } from '../middlewares/require-auth.js';
import { requireRole } from '../middlewares/require-role.js';
import { asyncHandler } from '../utils/async-handler.js';

const certificateRouter = Router();

certificateRouter.get(
  '/verify/:verificationCode',
  asyncHandler(verifyCertificate)
);

certificateRouter.get(
  '/my/courses/:courseId',
  requireAuth,
  requireRole('STUDENT'),
  asyncHandler(getMyCourseCertificate)
);

certificateRouter.post(
  '/my/courses/:courseId/issue',
  requireAuth,
  requireRole('STUDENT'),
  asyncHandler(issueMyCertificate)
);

export default certificateRouter;
