import mongoose from 'mongoose';

const { Schema, model, models } = mongoose;

import type { ICourse } from '../types/course.js';
import { COURSE_LEVELS, COURSE_STATUSES } from '../types/course.js';

const courseSchema = new Schema<ICourse>(
  {
    title: {
      type: String,
      required: true,
      trim: true,
      minlength: 5,
      maxlength: 120,
    },

    slug: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
      index: true,
    },

    shortDescription: {
      type: String,
      required: true,
      trim: true,
      minlength: 20,
      maxlength: 300,
    },

    description: {
      type: String,
      required: true,
      trim: true,
      minlength: 50,
      maxlength: 10000,
    },

    category: {
      type: String,
      required: true,
      trim: true,
      maxlength: 60,
    },

    level: {
      type: String,
      enum: COURSE_LEVELS,
      required: true,
    },

    price: {
      type: Number,
      required: true,
      min: 0,
      default: 0,
    },

    thumbnailUrl: {
      type: String,
      trim: true,
      default: null,
    },

    status: {
      type: String,
      enum: COURSE_STATUSES,
      default: 'DRAFT',
      index: true,
    },

    instructorId: {
      type: Schema.Types.ObjectId,
      ref: 'user',
      required: true,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

export const Course =
  mongoose.models.Course || mongoose.model<ICourse>('Course', courseSchema);

