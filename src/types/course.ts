import type { Types } from 'mongoose';

export const COURSE_LEVELS = ['BEGINNER', 'INTERMEDIATE', 'ADVANCED'] as const;

export const COURSE_STATUSES = [
  'DRAFT',
  'PENDING_REVIEW',
  'PUBLISHED',
  'REJECTED',
  'ARCHIVED',
] as const;

export type CourseLevel = (typeof COURSE_LEVELS)[number];

export type CourseStatus = (typeof COURSE_STATUSES)[number];

export interface ICourse {
  title: string;
  slug: string;
  shortDescription: string;
  description: string;
  category: string;
  level: CourseLevel;
  price: number;
  thumbnailUrl?: string | null;

  status: CourseStatus;

  instructorId: Types.ObjectId;

  reviewNote?: string | null;

  reviewedBy?: Types.ObjectId | null;

  reviewedAt?: Date | null;

  createdAt: Date;
  updatedAt: Date;
}
