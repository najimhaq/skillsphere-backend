import { Types } from 'mongoose';
import type { Request, Response } from 'express';

type CourseFilter = {
  status: 'PUBLISHED';
  category?: string;
  level?: string;
  $or?: Array<
    | { title: { $regex: string; $options: string } }
    | { shortDescription: { $regex: string; $options: string } }
    | { category: { $regex: string; $options: string } }
  >;
};

import { Course } from '../models/course.model.js';
import type { ICourse } from '../types/course.js';
import {
  createCourseSchema,
  getCoursesQuerySchema,
  updateCourseSchema,
  updateCourseStatusSchema,
} from '../validators/course.validator.js';
import type { UserRole } from '../types/auth.js';

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
  req: Request,
  res: Response
): Promise<void> => {
  const validation = getCoursesQuerySchema.safeParse(req.query);

  if (!validation.success) {
    res.status(400).json({
      success: false,
      message: 'Invalid query parameters',
      errors: validation.error.flatten().fieldErrors,
    });
    return;
  }

  const { page, limit, category, level, search } = validation.data;

  const filter: CourseFilter = {
    status: 'PUBLISHED',
  };

  if (category) {
    filter.category = category;
  }

  if (level) {
    filter.level = level;
  }

  if (search) {
    const safeSearch = search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

    filter.$or = [
      { title: { $regex: safeSearch, $options: 'i' } },
      { shortDescription: { $regex: safeSearch, $options: 'i' } },
      { category: { $regex: safeSearch, $options: 'i' } },
    ];
  }

  const skip = (page - 1) * limit;

  const [courses, totalCourses] = await Promise.all([
    Course.find(filter)
      .sort({ createdAt: -1, _id: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),

    Course.countDocuments(filter),
  ]);

  const totalPages = Math.ceil(totalCourses / limit);

  res.status(200).json({
    success: true,
    data: courses,
    pagination: {
      page,
      limit,
      totalCourses,
      totalPages,
      hasNextPage: page < totalPages,
      hasPreviousPage: page > 1,
    },
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

// PATCH /api/courses/:courseId
// → শুধু course owner বা ADMIN edit করতে পারবে

// DELETE /api/courses/:courseId
// → শুধু course owner বা ADMIN delete করতে পারবে

// POST /api/courses/:courseId/submit-review
// → DRAFT থেকে PENDING_REVIEW
// চল, এখন Instructor Course Management module তৈরি করি। এখানে instructor শুধু নিজের course edit/delete/submit করতে পারবে; ADMIN সব course manage করতে পারবে।

//identify course for management (edit/delete/submit) based on user role and ownership
const getCourseForManagement = async (
  courseId: string,
  userId: string,
  userRole: UserRole
) => {
  if (!Types.ObjectId.isValid(courseId)) {
    return {
      error: {
        statusCode: 400,
        message: 'Invalid course identifier',
      },
    };
  }

  const course = await Course.findById(courseId);

  if (!course) {
    return {
      error: {
        statusCode: 404,
        message: 'Course not found',
      },
    };
  }

  const isOwner = course.instructorId.toString() === userId;
  const isAdmin = userRole === 'ADMIN';

  if (!isOwner && !isAdmin) {
    return {
      error: {
        statusCode: 403,
        message: 'You do not have permission to manage this course',
      },
    };
  }

  return { course };
};

export const updateCourse = async (
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

  const courseIdParam = req.params.courseId;
  const courseId = Array.isArray(courseIdParam)
    ? courseIdParam[0]
    : courseIdParam;

  const result = await getCourseForManagement(courseId, user.id, user.role);

  if ('error' in result && result.error) {
    const { statusCode, message } = result.error;

    res.status(statusCode).json({
      success: false,
      message,
    });
    return;
  }

  if (result.course.status === 'PUBLISHED' && user.role !== 'ADMIN') {
    res.status(403).json({
      success: false,
      message: 'Published courses can only be edited by an admin',
    });
    return;
  }

  const validation = updateCourseSchema.safeParse(req.body);

  if (!validation.success) {
    res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: validation.error.flatten(),
    });
    return;
  }

  const course = await Course.findByIdAndUpdate(
    courseId,
    {
      $set: validation.data,
    },
    {
      returnDocument: 'after',
      runValidators: true,
    }
  ).lean();

  res.status(200).json({
    success: true,
    message: 'Course updated successfully',
    data: course,
  });
};

//delete course only by owner or admin
export const deleteCourse = async (
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

  const courseIdParam = req.params.courseId;
  const courseId = Array.isArray(courseIdParam)
    ? courseIdParam[0]
    : courseIdParam;

  const result = await getCourseForManagement(courseId, user.id, user.role);

  if ('error' in result && result.error) {
    const { statusCode, message } = result.error;

    res.status(statusCode).json({
      success: false,
      message,
    });
    return;
  }

  if (result.course.status === 'PUBLISHED' && user.role !== 'ADMIN') {
    res.status(403).json({
      success: false,
      message: 'Published courses can only be deleted by an admin',
    });
    return;
  }

  await result.course.deleteOne();

  res.status(200).json({
    success: true,
    message: 'Course deleted successfully',
  });
};

//submit course for review
export const submitCourseForReview = async (
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

  const courseIdParam = req.params.courseId;
  const courseId = Array.isArray(courseIdParam)
    ? courseIdParam[0]
    : courseIdParam;

  const result = await getCourseForManagement(courseId, user.id, user.role);

  if ('error' in result && result.error) {
    const { statusCode, message } = result.error;

    res.status(statusCode).json({
      success: false,
      message,
    });
    return;
  }

  if (result.course.status !== 'DRAFT') {
    res.status(400).json({
      success: false,
      message: 'Only draft courses can be submitted for review',
    });
    return;
  }

  result.course.status = 'PENDING_REVIEW';
  await result.course.save();

  res.status(200).json({
    success: true,
    message: 'Course submitted for review',
    data: result.course,
  });
};

// GET /api/courses?page=1&limit=12
// GET /api/courses?category=Web%20Development
// GET /api/courses?level=INTERMEDIATE
// GET /api/courses?search=typescript
// GET /api/courses?page=1&limit=12&category=Web%20Development&level=INTERMEDIATE
