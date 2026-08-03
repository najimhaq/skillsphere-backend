import express, { type Request, type Response } from 'express';
import { requireAuth } from '../middlewares/require-auth.js';
import { requireAdmin, requireRole } from '../middlewares/require-role.js';
import { adminTest, instructorTest } from '../controller/testController.js';

const testRouter = express.Router();

testRouter.get(
  '/instructor-test',
  requireAuth,
  requireRole('INSTRUCTOR', 'ADMIN'),instructorTest
);

testRouter.get('/admin-test', requireAuth, requireAdmin, adminTest);

export default testRouter;
