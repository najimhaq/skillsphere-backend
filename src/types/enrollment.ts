// STUDENT / INSTRUCTOR / ADMIN
//         ↓
// শুধু PUBLISHED course-এ enroll করতে পারবে
//         ↓
// এক user একই course-এ একবারই enroll করতে পারবে
//         ↓
// Enrollment শুরু হবে ACTIVE status-এ

import type { Types } from 'mongoose';

export const ENROLLMENT_STATUSES = [
  'ACTIVE',
  'COMPLETED',
  'CANCELLED',
] as const;

export type EnrollmentStatus = (typeof ENROLLMENT_STATUSES)[number];

export interface IEnrollment {
  studentId: Types.ObjectId;
  courseId: Types.ObjectId;
  status: EnrollmentStatus;
  progressPercentage: number;
  enrolledAt: Date;
  completedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}
