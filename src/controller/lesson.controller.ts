import { Types } from 'mongoose';
import type { Request, Response } from 'express';

import { Course } from '../models/course.model.js';
import { Lesson } from '../models/lesson.model.js';

const getLessonIdParam = (lessonIdParam: string | string[]) => {
  return Array.isArray(lessonIdParam) ? lessonIdParam[0] : lessonIdParam;
};

const getValidationErrors = (error: unknown) => {
  if (error && typeof error === 'object' && 'errors' in error) {
    const mongooseError = error as {
      errors?: Record<string, { message?: string }>;
    };

    return Object.fromEntries(
      Object.entries(mongooseError.errors ?? {}).map(([field, details]) => [
        field,
        details.message ?? 'Invalid value',
      ])
    );
  }

  return undefined;
};

export const updateLesson = async (
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

  const lessonId = getLessonIdParam(req.params.lessonId);

  if (!Types.ObjectId.isValid(lessonId)) {
    res.status(400).json({
      success: false,
      message: 'Invalid lesson identifier',
    });
    return;
  }

  const lesson = await Lesson.findById(lessonId);

  if (!lesson) {
    res.status(404).json({
      success: false,
      message: 'Lesson not found',
    });
    return;
  }

  const course = await Course.findById(lesson.courseId);

  if (!course) {
    res.status(404).json({
      success: false,
      message: 'Course not found',
    });
    return;
  }

  const isOwner = course.instructorId.toString() === user.id;
  const isAdmin = user.role === 'ADMIN';

  if (!isOwner && !isAdmin) {
    res.status(403).json({
      success: false,
      message: 'You do not have permission to update this lesson',
    });
    return;
  }

  if (course.status !== 'DRAFT' && !isAdmin) {
    res.status(403).json({
      success: false,
      message: 'Only lessons in draft courses can be updated',
    });
    return;
  }

  const { title, type, videoUrl, content, durationMinutes, isPreview } =
    req.body as {
      title?: unknown;
      type?: unknown;
      videoUrl?: unknown;
      content?: unknown;
      durationMinutes?: unknown;
      isPreview?: unknown;
    };

  const nextType = type ?? lesson.type;

  if (nextType !== 'VIDEO' && nextType !== 'ARTICLE') {
    res.status(400).json({
      success: false,
      message: 'Lesson type must be VIDEO or ARTICLE',
    });
    return;
  }

  if (title !== undefined) {
    if (
      typeof title !== 'string' ||
      title.trim().length < 2 ||
      title.trim().length > 160
    ) {
      res.status(400).json({
        success: false,
        message: 'Lesson title must be between 2 and 160 characters',
      });
      return;
    }

    lesson.title = title.trim();
  }

  if (durationMinutes !== undefined) {
    if (
      typeof durationMinutes !== 'number' ||
      !Number.isInteger(durationMinutes) ||
      durationMinutes < 0
    ) {
      res.status(400).json({
        success: false,
        message: 'Duration must be a whole number greater than or equal to 0',
      });
      return;
    }

    lesson.durationMinutes = durationMinutes;
  }

  if (isPreview !== undefined) {
    if (typeof isPreview !== 'boolean') {
      res.status(400).json({
        success: false,
        message: 'isPreview must be true or false',
      });
      return;
    }

    lesson.isPreview = isPreview;
  }

  lesson.type = nextType;

  if (nextType === 'VIDEO') {
    const nextVideoUrl = videoUrl ?? lesson.videoUrl;

    if (typeof nextVideoUrl !== 'string' || nextVideoUrl.trim().length === 0) {
      res.status(400).json({
        success: false,
        message: 'Video URL is required for a video lesson',
      });
      return;
    }

    lesson.videoUrl = nextVideoUrl.trim();
    lesson.content = null;
  }

  if (nextType === 'ARTICLE') {
    const nextContent = content ?? lesson.content;

    if (
      typeof nextContent !== 'string' ||
      nextContent.trim().length < 20 ||
      nextContent.trim().length > 50000
    ) {
      res.status(400).json({
        success: false,
        message: 'Article content must be between 20 and 50000 characters',
      });
      return;
    }

    lesson.content = nextContent.trim();
    lesson.videoUrl = null;
  }

  try {
    await lesson.save();

    res.status(200).json({
      success: true,
      message: 'Lesson updated successfully',
      data: lesson,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: 'Unable to update lesson',
      errors: getValidationErrors(error),
    });
  }
};

export const deleteLesson = async (
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

  const lessonId = getLessonIdParam(req.params.lessonId);

  if (!Types.ObjectId.isValid(lessonId)) {
    res.status(400).json({
      success: false,
      message: 'Invalid lesson identifier',
    });
    return;
  }

  const lesson = await Lesson.findById(lessonId);

  if (!lesson) {
    res.status(404).json({
      success: false,
      message: 'Lesson not found',
    });
    return;
  }

  const course = await Course.findById(lesson.courseId);

  if (!course) {
    res.status(404).json({
      success: false,
      message: 'Course not found',
    });
    return;
  }

  const isOwner = course.instructorId.toString() === user.id;
  const isAdmin = user.role === 'ADMIN';

  if (!isOwner && !isAdmin) {
    res.status(403).json({
      success: false,
      message: 'You do not have permission to delete this lesson',
    });
    return;
  }

  if (course.status !== 'DRAFT' && !isAdmin) {
    res.status(403).json({
      success: false,
      message: 'Only lessons in draft courses can be deleted',
    });
    return;
  }

  await lesson.deleteOne();

  res.status(200).json({
    success: true,
    message: 'Lesson deleted successfully',
    data: {
      _id: lesson._id,
    },
  });
};
