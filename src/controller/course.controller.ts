import { Types } from 'mongoose';
import type { Request, Response } from 'express';

import { Course } from '../models/course.model.js';
import { createCourseSchema, updateCourseStatusSchema } from '../validators/course.validator.js';

const createSlug = (title: string): string => {
  return `${title
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')}-${Date.now()}`;
};

export const createCourse = async (
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

  const validation = createCourseSchema.safeParse(req.body);

  if (!validation.success) {
    res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: validation.error.flatten().fieldErrors,
    });
    return;
  }

  if (!Types.ObjectId.isValid(user.id)) {
    res.status(400).json({
      success: false,
      message: 'Invalid instructor identifier',
    });
    return;
  }

  const course = await Course.create({
    ...validation.data,
    slug: createSlug(validation.data.title),
    instructorId: new Types.ObjectId(user.id),
    status: 'DRAFT',
  });

  res.status(201).json({
    success: true,
    message: 'Course created successfully as draft',
    data: course,
  });
};

export const getPublishedCourses = async (
  _req: Request,
  res: Response
): Promise<void> => {
  const courses = await Course.find({ status: 'PUBLISHED' })
    .sort({ createdAt: -1 })
    .lean();

  res.status(200).json({
    success: true,
    data: courses,
  });
};

export const getMyCourses = async (
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
      message: 'Invalid instructor identifier',
    });
    return;
  }

  const courses = await Course.find({
    instructorId: new Types.ObjectId(user.id),
  })
    .sort({ createdAt: -1 })
    .lean();

  res.status(200).json({
    success: true,
    data: courses,
  });
};

export const getPublishedCourseBySlug = async (
  req: Request,
  res: Response
): Promise<void> => {
  const { slug } = req.params;

  const course = await Course.findOne({
    slug,
    status: 'PUBLISHED',
  }).lean();

  if (!course) {
    res.status(404).json({
      success: false,
      message: 'Course not found',
    });
    return;
  }

  res.status(200).json({
    success: true,
    data: course,
  });
};

//update course status
export const updateCourseStatus = async (
  req: Request,
  res: Response
): Promise<void> => {
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

  const validation = updateCourseStatusSchema.safeParse(req.body);

  if (!validation.success) {
    res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: validation.error.flatten().fieldErrors,
    });
    return;
  }

  const course = await Course.findByIdAndUpdate(
    courseId,
    {
      $set: {
        status: validation.data.status,
      },
    },
    {
      returnDocument: 'after',
      runValidators: true,
    }
  ).lean();

  if (!course) {
    res.status(404).json({
      success: false,
      message: 'Course not found',
    });
    return;
  }

  res.status(200).json({
    success: true,
    message: `Course status updated to ${course.status}`,
    data: course,
  });
};
