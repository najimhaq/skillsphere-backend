import { z } from 'zod';

export const createSectionSchema = z.object({
  title: z
    .string()
    .trim()
    .min(2, 'Section title must be at least 2 characters')
    .max(120, 'Section title cannot exceed 120 characters'),

  order: z
    .number()
    .int('Order must be a whole number')
    .min(1, 'Order must be at least 1'),
});

export const updateSectionSchema = createSectionSchema.partial();

export const createLessonSchema = z.discriminatedUnion('type', [
  z.object({
    title: z
      .string()
      .trim()
      .min(2, 'Lesson title must be at least 2 characters')
      .max(160, 'Lesson title cannot exceed 160 characters'),

    type: z.literal('VIDEO'),

    videoUrl: z
      .string()
      .trim()
      .url('Please provide a valid video URL'),

    durationMinutes: z
      .number()
      .int('Duration must be a whole number')
      .min(0, 'Duration cannot be negative')
      .default(0),

    isPreview: z.boolean().default(false),

    order: z
      .number()
      .int('Order must be a whole number')
      .min(1, 'Order must be at least 1'),
  }),

  z.object({
    title: z
      .string()
      .trim()
      .min(2, 'Lesson title must be at least 2 characters')
      .max(160, 'Lesson title cannot exceed 160 characters'),

    type: z.literal('ARTICLE'),

    content: z
      .string()
      .trim()
      .min(20, 'Article content must be at least 20 characters')
      .max(50000, 'Article content cannot exceed 50,000 characters'),

    durationMinutes: z
      .number()
      .int('Duration must be a whole number')
      .min(0, 'Duration cannot be negative')
      .default(0),

    isPreview: z.boolean().default(false),

    order: z
      .number()
      .int('Order must be a whole number')
      .min(1, 'Order must be at least 1'),
  }),
]);

export const updateLessonSchema = z
  .object({
    title: z
      .string()
      .trim()
      .min(2, 'Lesson title must be at least 2 characters')
      .max(160, 'Lesson title cannot exceed 160 characters')
      .optional(),

    type: z.enum(['VIDEO', 'ARTICLE']).optional(),

    videoUrl: z
      .string()
      .trim()
      .url('Please provide a valid video URL')
      .nullable()
      .optional(),

    content: z
      .string()
      .trim()
      .min(20, 'Article content must be at least 20 characters')
      .max(50000, 'Article content cannot exceed 50,000 characters')
      .nullable()
      .optional(),

    durationMinutes: z
      .number()
      .int('Duration must be a whole number')
      .min(0, 'Duration cannot be negative')
      .optional(),

    isPreview: z.boolean().optional(),

    order: z
      .number()
      .int('Order must be a whole number')
      .min(1, 'Order must be at least 1')
      .optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: 'At least one field is required',
  });
