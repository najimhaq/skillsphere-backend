import { Router } from 'express';
import { requireAuth } from '../../middlewares/require-auth.js';
import { requireRole } from '../../middlewares/require-role.js';
import { getInstructorStudents } from '../../controller/instructor.controller.js';
import { getInstructorProfile, updateInstructorProfile, updateInstructorSettings } from '../../controller/instructor/instructor-profile.controller.js';




const instructorRoutes = Router();

instructorRoutes.use(requireAuth, requireRole('INSTRUCTOR'));

instructorRoutes.get('/students', getInstructorStudents);

instructorRoutes.get('/profile', getInstructorProfile);

instructorRoutes.patch('/profile', updateInstructorProfile);

instructorRoutes.patch('/settings', updateInstructorSettings);

export default instructorRoutes;
