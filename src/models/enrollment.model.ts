import mongoose from 'mongoose';

import type { IEnrollment } from '../types/enrollment.js';
import { ENROLLMENT_STATUSES } from '../types/enrollment.js';

const enrollmentSchema = new mongoose.Schema<IEnrollment>(
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

    status: {
      type: String,
      enum: ENROLLMENT_STATUSES,
      default: 'ACTIVE',
      index: true,
    },

    progressPercentage: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },

    enrolledAt: {
      type: Date,
      default: Date.now,
    },

    completedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

enrollmentSchema.index(
  {
    studentId: 1,
    courseId: 1,
  },
  {
    unique: true,
  }
);

export const Enrollment =
  mongoose.models.Enrollment ||
  mongoose.model<IEnrollment>('Enrollment', enrollmentSchema);
