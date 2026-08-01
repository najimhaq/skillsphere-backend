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


// Update course
export const updateCourseSchema = z
  .object({
    title: z
      .string()
      .trim()
      .min(5, 'Title must be at least 5 characters')
      .max(120, 'Title cannot exceed 120 characters')
      .optional(),

    shortDescription: z
      .string()
      .trim()
      .min(20, 'Short description must be at least 20 characters')
      .max(300, 'Short description cannot exceed 300 characters')
      .optional(),

    description: z
      .string()
      .trim()
      .min(50, 'Description must be at least 50 characters')
      .max(10000, 'Description cannot exceed 10,000 characters')
      .optional(),

    category: z
      .string()
      .trim()
      .min(2, 'Category must be at least 2 characters')
      .max(60, 'Category cannot exceed 60 characters')
      .optional(),

    level: z.enum(COURSE_LEVELS).optional(),

    price: z.number().min(0, 'Price cannot be negative').optional(),

    thumbnailUrl: z.url('Thumbnail URL must be a valid URL').optional(),
  })
  .strict()
  .refine((data) => Object.keys(data).length > 0, {
    message: 'At least one field must be provided',
  });

export type UpdateCourseInput = z.infer<typeof updateCourseSchema>;

// Get my courses query schema

export const getCoursesQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),

  limit: z.coerce.number().int().min(1).max(50).default(12),

  category: z
    .string()
    .trim()
    .min(2)
    .max(60)
    .optional(),

  level: z.enum(COURSE_LEVELS).optional(),

  search: z
    .string()
    .trim()
    .min(2, "Search must have at least 2 characters")
    .max(100)
    .optional(),
});

export type GetCoursesQuery = z.infer<typeof getCoursesQuerySchema>;
