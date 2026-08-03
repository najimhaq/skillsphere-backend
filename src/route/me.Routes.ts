// src/route/meRoutes.ts
import express, { type Request, type Response } from 'express';
import { authController } from '../controller/authController.js';

const meRouter = express.Router();

meRouter.get('/me', authController);

export default meRouter;
