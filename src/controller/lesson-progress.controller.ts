//src/controller/lesson-progress.controller.ts
import { Types } from 'mongoose';
import type { Request, Response } from 'express';

import { Enrollment } from '../models/enrollment.model.js';
import { Lesson } from '../models/lesson.model.js';
import { LessonProgress } from '../models/lesson-progress.model.js';

const getLessonIdParam = (lessonIdParam: string | string[]) => {
  return Array.isArray(lessonIdParam) ? lessonIdParam[0] : lessonIdParam;
};

const updateEnrollmentProgress = async (
  studentId: Types.ObjectId,
  courseId: Types.ObjectId
) => {
  const [totalLessons, completedLessons] = await Promise.all([
    Lesson.countDocuments({ courseId }),

    LessonProgress.countDocuments({
      studentId,
      courseId,
    }),
  ]);

  const progressPercentage =
    totalLessons === 0
      ? 0
      : Math.round((completedLessons / totalLessons) * 100);

  const isCourseCompleted =
    totalLessons > 0 && completedLessons >= totalLessons;

  const enrollment = await Enrollment.findOneAndUpdate(
    {
      studentId,
      courseId,
    },
    {
      $set: {
        progressPercentage,
        status: isCourseCompleted ? 'COMPLETED' : 'ACTIVE',
        completedAt: isCourseCompleted ? new Date() : null,
      },
    },
    {
      new: true,
    }
  ).lean();

  return {
    enrollment,
    totalLessons,
    completedLessons,
    progressPercentage,
    isCourseCompleted,
  };
};

export const markLessonAsComplete = async (
  req: Request,
  res: Response
): Promise<void> => {
  const user = req.authUser;

  if (!user) {
    res.status(401).json({
      success: false,
      message: 'Authentication required',
    });
    return;
  }

  if (user.role !== 'STUDENT') {
    res.status(403).json({
      success: false,
      message: 'Only students can update lesson progress',
    });
    return;
  }

  const lessonId = getLessonIdParam(req.params.lessonId);

  if (!Types.ObjectId.isValid(lessonId)) {
    res.status(400).json({
      success: false,
      message: 'Invalid lesson identifier',
    });
    return;
  }

  if (!Types.ObjectId.isValid(user.id)) {
    res.status(400).json({
      success: false,
      message: 'Invalid student identifier',
    });
    return;
  }

  const studentId = new Types.ObjectId(user.id);
  const lesson = await Lesson.findById(lessonId).lean();

  if (!lesson) {
    res.status(404).json({
      success: false,
      message: 'Lesson not found',
    });
    return;
  }

  const enrollment = await Enrollment.findOne({
    studentId,
    courseId: lesson.courseId,
    status: { $in: ['ACTIVE', 'COMPLETED'] },
  }).lean();

  if (!enrollment) {
    res.status(403).json({
      success: false,
      message: 'Enroll in this course to update lesson progress',
    });
    return;
  }

  const existingProgress = await LessonProgress.findOne({
    studentId,
    lessonId: lesson._id,
  }).lean();

  if (existingProgress) {
    const summary = await updateEnrollmentProgress(studentId, lesson.courseId);

    res.status(200).json({
      success: true,
      message: 'Lesson is already marked as complete',
      data: {
        lessonId: lesson._id,
        completed: true,
        ...summary,
      },
    });
    return;
  }

  await LessonProgress.create({
    studentId,
    courseId: lesson.courseId,
    lessonId: lesson._id,
  });

  const summary = await updateEnrollmentProgress(studentId, lesson.courseId);

  res.status(200).json({
    success: true,
    message: 'Lesson marked as complete',
    data: {
      lessonId: lesson._id,
      completed: true,
      ...summary,
    },
  });
};

export const markLessonAsIncomplete = async (
  req: Request,
  res: Response
): Promise<void> => {
  const user = req.authUser;

  if (!user) {
    res.status(401).json({
      success: false,
      message: 'Authentication required',
    });
    return;
  }

  if (user.role !== 'STUDENT') {
    res.status(403).json({
      success: false,
      message: 'Only students can update lesson progress',
    });
    return;
  }

  const lessonId = getLessonIdParam(req.params.lessonId);

  if (!Types.ObjectId.isValid(lessonId)) {
    res.status(400).json({
      success: false,
      message: 'Invalid lesson identifier',
    });
    return;
  }

  if (!Types.ObjectId.isValid(user.id)) {
    res.status(400).json({
      success: false,
      message: 'Invalid student identifier',
    });
    return;
  }

  const studentId = new Types.ObjectId(user.id);
  const lesson = await Lesson.findById(lessonId).lean();

  if (!lesson) {
    res.status(404).json({
      success: false,
      message: 'Lesson not found',
    });
    return;
  }

  const enrollment = await Enrollment.findOne({
    studentId,
    courseId: lesson.courseId,
    status: { $in: ['ACTIVE', 'COMPLETED'] },
  }).lean();

  if (!enrollment) {
    res.status(403).json({
      success: false,
      message: 'Enroll in this course to update lesson progress',
    });
    return;
  }

  await LessonProgress.findOneAndDelete({
    studentId,
    lessonId: lesson._id,
  });

  const summary = await updateEnrollmentProgress(studentId, lesson.courseId);

  res.status(200).json({
    success: true,
    message: 'Lesson marked as incomplete',
    data: {
      lessonId: lesson._id,
      completed: false,
      ...summary,
    },
  });
};

export const getMyCourseProgress = async (
  req: Request,
  res: Response
): Promise<void> => {
  const user = req.authUser;

  if (!user) {
    res.status(401).json({
      success: false,
      message: 'Authentication required',
    });
    return;
  }

  if (user.role !== 'STUDENT') {
    res.status(403).json({
      success: false,
      message: 'Only students can access lesson progress',
    });
    return;
  }

  const courseIdParam = req.params.courseId;
  const courseId = Array.isArray(courseIdParam)
    ? courseIdParam[0]
    : courseIdParam;

  if (!Types.ObjectId.isValid(courseId)) {
    res.status(400).json({
      success: false,
      message: 'Invalid course identifier',
    });
    return;
  }

  if (!Types.ObjectId.isValid(user.id)) {
    res.status(400).json({
      success: false,
      message: 'Invalid student identifier',
    });
    return;
  }

  const studentId = new Types.ObjectId(user.id);
  const courseObjectId = new Types.ObjectId(courseId);

  const enrollment = await Enrollment.findOne({
    studentId,
    courseId: courseObjectId,
    status: { $in: ['ACTIVE', 'COMPLETED'] },
  }).lean();

  if (!enrollment) {
    res.status(403).json({
      success: false,
      message: 'Enroll in this course to access lesson progress',
    });
    return;
  }

  const completedProgress = await LessonProgress.find({
    studentId,
    courseId: courseObjectId,
  })
    .select('lessonId')
    .lean();

  const completedLessonIds = completedProgress.map((progress) =>
    progress.lessonId.toString()
  );

  const totalLessons = await Lesson.countDocuments({
    courseId: courseObjectId,
  });

  res.status(200).json({
    success: true,
    data: {
      courseId,
      completedLessonIds,
      totalLessons,
      completedLessons: completedLessonIds.length,
      progressPercentage: enrollment.progressPercentage,
      status: enrollment.status,
      completedAt: enrollment.completedAt ?? null,
    },
  });
};
