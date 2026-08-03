import type { Types } from 'mongoose';

export interface ILessonProgress {
  studentId: Types.ObjectId;
  courseId: Types.ObjectId;
  lessonId: Types.ObjectId;
  completedAt: Date;
  createdAt: Date;
  updatedAt: Date;
}
