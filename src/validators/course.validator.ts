import { z } from 'zod';

import { COURSE_LEVELS, COURSE_STATUSES } from '../types/course.js';

export const createCourseSchema = z.object({
  title: z
    .string()
    .trim()
    .min(5, 'Title must be at least 5 characters')
    .max(120, 'Title cannot exceed 120 characters'),

  shortDescription: z
    .string()
    .trim()
    .min(20, 'Short description must be at least 20 characters')
    .max(300, 'Short description cannot exceed 300 characters'),

  description: z
    .string()
    .trim()
    .min(50, 'Description must be at least 50 characters')
    .max(10000, 'Description cannot exceed 10,000 characters'),

  category: z
    .string()
    .trim()
    .min(2, 'Category must be at least 2 characters')
    .max(60, 'Category cannot exceed 60 characters'),

  level: z.enum(COURSE_LEVELS),

  price: z.number().min(0, 'Price cannot be negative').default(0),

  thumbnailUrl: z.url('Thumbnail URL must be a valid URL').optional(),
});

export type CreateCourseInput = z.infer<typeof createCourseSchema>;
export const updateCourseStatusSchema = z.object({
  status: z.enum(COURSE_STATUSES),
});
