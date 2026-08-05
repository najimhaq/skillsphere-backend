import type { Request, Response } from 'express';
import { Types } from 'mongoose';

import { Course } from '../models/course.model.js';
import { Enrollment } from '../models/enrollment.model.js';
import { PlatformSettings } from '../models/admin/platform-settings.model.js';

export const enrollInCourse = async (
  req: Request,
  res: Response
): Promise<void> => {
  const user = req.authUser;
  const { courseId } = req.params;
  const normalizedCourseId = Array.isArray(courseId) ? courseId[0] : courseId;

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
      message: 'Only students can enroll in courses.',
    });
    return;
  }

  const platformSettings = await PlatformSettings.findOne({
    key: 'PLATFORM',
  }).lean();

  if (platformSettings && !platformSettings.allowNewEnrollments) {
    res.status(503).json({
      success: false,
      message:
        'New course enrollments are temporarily unavailable. Please try again later.',
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

  if (!Types.ObjectId.isValid(normalizedCourseId)) {
    res.status(400).json({
      success: false,
      message: 'Invalid course identifier',
    });
    return;
  }

  const course = await Course.findOne({
    _id: normalizedCourseId,
    status: 'PUBLISHED',
  }).lean();

  if (!course) {
    res.status(404).json({
      success: false,
      message: 'Published course not found',
    });
    return;
  }

  if (course.price > 0) {
    res.status(402).json({
      success: false,
      message:
        'This is a paid course. Please complete payment before enrolling.',
    });
    return;
  }
  try {
    const enrollment = await Enrollment.create({
      studentId: new Types.ObjectId(user.id),
      courseId: new Types.ObjectId(normalizedCourseId),
      status: 'ACTIVE',
      progressPercentage: 0,
    });

    res.status(201).json({
      success: true,
      message: 'Enrolled in course successfully',
      data: enrollment,
    });
  } catch (error: unknown) {
    if (
      typeof error === 'object' &&
      error !== null &&
      'code' in error &&
      error.code === 11000
    ) {
      res.status(409).json({
        success: false,
        message: 'You are already enrolled in this course',
      });
      return;
    }

    throw error;
  }
};

export const getMyEnrollments = async (
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

  if (!Types.ObjectId.isValid(user.id)) {
    res.status(400).json({
      success: false,
      message: 'Invalid student identifier',
    });
    return;
  }

  const enrollments = await Enrollment.find({
    studentId: new Types.ObjectId(user.id),
  })
    .populate({
      path: 'courseId',
      select:
        'title slug shortDescription thumbnailUrl category level price status',
    })
    .sort({ enrolledAt: -1 })
    .lean();

  res.status(200).json({
    success: true,
    data: enrollments,
  });
};
