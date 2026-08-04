//src/models/lesson.model.ts
import mongoose, { Schema } from 'mongoose';

export const LESSON_TYPES = ['VIDEO', 'ARTICLE'] as const;

export type LessonType = (typeof LESSON_TYPES)[number];

export interface ILesson {
  courseId: mongoose.Types.ObjectId;
  sectionId: mongoose.Types.ObjectId;
  title: string;
  type: LessonType;
  videoUrl: string | null;
  content: string | null;
  durationMinutes: number;
  isPreview: boolean;
  order: number;
  createdAt: Date;
  updatedAt: Date;
}

const lessonSchema = new Schema<ILesson>(
  {
    courseId: {
      type: Schema.Types.ObjectId,
      ref: 'Course',
      required: true,
      index: true,
    },

    sectionId: {
      type: Schema.Types.ObjectId,
      ref: 'CourseSection',
      required: true,
      index: true,
    },

    title: {
      type: String,
      required: true,
      trim: true,
      minlength: 2,
      maxlength: 160,
    },

    type: {
      type: String,
      enum: LESSON_TYPES,
      required: true,
    },

    videoUrl: {
      type: String,
      trim: true,
      default: null,
    },

    content: {
      type: String,
      trim: true,
      default: null,
      maxlength: 50000,
    },

    durationMinutes: {
      type: Number,
      min: 0,
      default: 0,
    },

    isPreview: {
      type: Boolean,
      default: false,
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

lessonSchema.index({ sectionId: 1, order: 1 }, { unique: true });

lessonSchema.pre('validate', function () {
  if (this.type === 'VIDEO' && !this.videoUrl) {
    this.invalidate('videoUrl', 'Video URL is required for a video lesson');
  }

  if (this.type === 'ARTICLE' && !this.content) {
    this.invalidate('content', 'Content is required for an article lesson');
  }
});

export const Lesson =
  mongoose.models.Lesson || mongoose.model<ILesson>('Lesson', lessonSchema);
