import 'dotenv/config';
import cors from 'cors';
import express, { type Request, type Response } from 'express';
import { fromNodeHeaders, toNodeHandler } from 'better-auth/node';
import { connectDatabase } from './config/db.js';
import { env } from './config/env.js';
import { auth } from './lib/auth.js';
import meRouter from './route/meRoutes.js';
import testRouter from './route/testRoutes.js';
import courseRouter from './route/course.routes.js';
import enrollmentRouter from './route/enrollment.routes.js';

const app = express();

app.use(
  cors({
    origin: env.FRONTEND_URL,
    credentials: true,
  })
);

app.get('/api/health', (_req: Request, res: Response) => {
  res.status(200).json({
    success: true,
    message: 'SkillSphere API is running',
    environment: env.NODE_ENV,
  });
});


// Better Auth handler must be before express.json()
app.all('/api/auth/*splat', toNodeHandler(auth));

app.use(express.json());


//better auth session pawa jabe
app.use('/api', meRouter);
app.use('/api', testRouter);
//course route
app.use('/api/courses', courseRouter);
//enrollment route
app.use('/api/enrollments', enrollmentRouter);

const startServer = async (): Promise<void> => {
  await connectDatabase();

  app.listen(env.PORT, () => {
    console.log(`SkillSphere API is running on http://localhost:${env.PORT}`);
  });
};

void startServer();
