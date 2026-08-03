import type { Types } from 'mongoose';

export type InstructorProfileDocument = {
  userId: Types.ObjectId;

  headline: string;
  bio: string;
  expertise: string[];

  website: string;
  linkedinUrl: string;
  githubUrl: string;

  notifyNewEnrollment: boolean;
  notifyCourseReview: boolean;
  notifyStudentCompletion: boolean;

  createdAt?: Date;
  updatedAt?: Date;
};
