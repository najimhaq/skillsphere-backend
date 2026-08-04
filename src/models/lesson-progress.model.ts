//src/models/lesson-progress.model.ts
import mongoose from 'mongoose';

import type { ILessonProgress } from '../types/lesson-progress.js';

const lessonProgressSchema = new mongoose.Schema<ILessonProgress>(
  {
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'user',
      required: true,
      index: true,
    },

    courseId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Course',
      required: true,
      index: true,
    },

    lessonId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Lesson',
      required: true,
      index: true,
    },

    completedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

lessonProgressSchema.index(
  {
    studentId: 1,
    lessonId: 1,
  },
  {
    unique: true,
  }
);

lessonProgressSchema.index({
  studentId: 1,
  courseId: 1,
});

export const LessonProgress =
  mongoose.models.LessonProgress ||
  mongoose.model<ILessonProgress>('LessonProgress', lessonProgressSchema);
