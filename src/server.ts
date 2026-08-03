//src/server.ts
import 'dotenv/config';
import cors from 'cors';
import express, { type Request, type Response } from 'express';
import { fromNodeHeaders, toNodeHandler } from 'better-auth/node';
import { connectDatabase } from './config/db.js';
import { env } from './config/env.js';
import { auth } from './lib/auth.js';
import meRouter from './route/me.Routes.js';
import testRouter from './route/test.Routes.js';
import courseRouter from './route/course.routes.js';
import enrollmentRouter from './route/enrollment.routes.js';
import lessonRouter from './route/lesson.routes.js';
import sectionRouter from './route/section.routes.js';
import studentLearningRouter from './route/student-learning.routes.js';
import lessonProgressRouter from './route/lesson-progress.routes.js';
import certificateRouter from './route/certificate.routes.js';
import studentDashboardRouter from './route/student-dashboard.routes.js';
import instructorRoutes from './route/instructor/instructor.routes.js';


const app = express();

app.use(
  cors({
    origin: env.FRONTEND_URL ?? 'http://localhost:3000',
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
//course route for all course related endpoints
app.use('/api/courses', courseRouter);
//enrollment route for student enrollment related endpoints
app.use('/api/enrollments', enrollmentRouter);
//lesson route for all lesson related endpoints
app.use('/api/lessons', lessonRouter);
//section route
app.use('/api/sections', sectionRouter);
//student learning route
app.use('/api/learning', studentLearningRouter);
//lesson progress route
app.use('/api/lesson-progress', lessonProgressRouter);
//certificate route
app.use('/api/certificates', certificateRouter);
//student dashboard route
app.use('/api/dashboard/student', studentDashboardRouter);
//instructor route
app.use('/api/instructor', instructorRoutes);

const startServer = async (): Promise<void> => {
  await connectDatabase();

  app.listen(env.PORT, () => {
    console.log(`SkillSphere API is running on http://localhost:${env.PORT}`);
  });
};

void startServer();
