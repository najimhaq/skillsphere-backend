import mongoose, { Schema } from 'mongoose';

export interface ICourseSection {
  courseId: mongoose.Types.ObjectId;
  title: string;
  order: number;
  createdAt: Date;
  updatedAt: Date;
}

const courseSectionSchema = new Schema<ICourseSection>(
  {
    courseId: {
      type: Schema.Types.ObjectId,
      ref: 'Course',
      required: true,
      index: true,
    },

    title: {
      type: String,
      required: true,
      trim: true,
      minlength: 2,
      maxlength: 120,
    },

    order: {
      type: Number,
      required: true,
      min: 1,
    },
  },
  {
    timestamps: true,
  }
);

courseSectionSchema.index({ courseId: 1, order: 1 }, { unique: true });

export const CourseSection =
  mongoose.models.CourseSection ||
  mongoose.model<ICourseSection>('CourseSection', courseSectionSchema);
