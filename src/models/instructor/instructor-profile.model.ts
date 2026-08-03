import mongoose, { Schema } from 'mongoose';
import type { InstructorProfileDocument } from '../../types/instructor/instructor-profile.js';



const instructorProfileSchema = new Schema<InstructorProfileDocument>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      required: true,
      unique: true,
      index: true,
    },

    headline: {
      type: String,
      trim: true,
      maxlength: 120,
      default: '',
    },

    bio: {
      type: String,
      trim: true,
      maxlength: 2000,
      default: '',
    },

    expertise: {
      type: [String],
      default: [],
      validate: {
        validator: (values: string[]) =>
          values.length <= 12 &&
          values.every(
            (value) =>
              typeof value === 'string' &&
              value.trim().length >= 1 &&
              value.trim().length <= 40
          ),
        message:
          'You can add up to 12 expertise items, each with a maximum of 40 characters.',
      },
    },

    website: {
      type: String,
      trim: true,
      maxlength: 300,
      default: '',
    },

    linkedinUrl: {
      type: String,
      trim: true,
      maxlength: 300,
      default: '',
    },

    githubUrl: {
      type: String,
      trim: true,
      maxlength: 300,
      default: '',
    },

    notifyNewEnrollment: {
      type: Boolean,
      default: true,
    },

    notifyCourseReview: {
      type: Boolean,
      default: true,
    },

    notifyStudentCompletion: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

export const InstructorProfile =
  mongoose.models.InstructorProfile ||
  mongoose.model<InstructorProfileDocument>(
    'InstructorProfile',
    instructorProfileSchema
  );
