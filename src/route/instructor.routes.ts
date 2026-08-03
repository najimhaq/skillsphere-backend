import { Router } from 'express';
import { requireAuth } from '../middlewares/require-auth.js';
import { requireInstructor, requireRole } from '../middlewares/require-role.js';
import { getInstructorStudents } from '../controller/instructor.controller.js';

const router = Router();

router.get('/students', requireAuth, requireInstructor, getInstructorStudents);

export default router;
