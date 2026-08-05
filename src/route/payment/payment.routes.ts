import { Router } from 'express';

import { createStripeCheckoutSession } from '../../controller/payment/payment.controller.js';
import { requireAuth } from '../../middlewares/require-auth.js';
import { requireRole } from '../../middlewares/require-role.js';
import { asyncHandler } from '../../utils/async-handler.js';

const paymentRouter = Router();

paymentRouter.post(
  '/checkout',
  requireAuth,
  requireRole('STUDENT'),
  asyncHandler(createStripeCheckoutSession)
);

export default paymentRouter;
