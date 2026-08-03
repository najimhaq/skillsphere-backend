import mongoose from 'mongoose';

import type { ICertificate } from '../types/certificate.js';

const certificateSchema = new mongoose.Schema<ICertificate>(
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

    enrollmentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Enrollment',
      required: true,
      unique: true,
    },

    studentName: {
      type: String,
      required: true,
      trim: true,
      maxlength: 120,
    },

    courseTitle: {
      type: String,
      required: true,
      trim: true,
      maxlength: 120,
    },

    certificateNumber: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      index: true,
    },

    verificationCode: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      index: true,
    },

    issuedAt: {
      type: Date,
      required: true,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

certificateSchema.index(
  {
    studentId: 1,
    courseId: 1,
  },
  {
    unique: true,
  }
);

export const Certificate =
  mongoose.models.Certificate ||
  mongoose.model<ICertificate>('Certificate', certificateSchema);
