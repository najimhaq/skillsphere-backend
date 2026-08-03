import type { Types } from 'mongoose';

export interface ICertificate {
  studentId: Types.ObjectId;
  courseId: Types.ObjectId;
  enrollmentId: Types.ObjectId;

  studentName: string;
  courseTitle: string;

  certificateNumber: string;
  verificationCode: string;

  issuedAt: Date;
  createdAt: Date;
  updatedAt: Date;
}
