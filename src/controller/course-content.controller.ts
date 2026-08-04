//src/controller/course-content.controller.ts
import { Types } from 'mongoose';
import type { Request, Response } from 'express';

import { Course } from '../models/course.model.js';
import { CourseSection } from '../models/course-section.model.js';
import { Lesson } from '../models/lesson.model.js';
import type { UserRole } from '../types/auth.js';
import {
  createLessonSchema,
  createSectionSchema,
} from '../validators/course-content.validator.js';

const getCourseForContentManagement = async (
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
        message: 'You do not have permission to manage this course content',
      },
    };
  }

  return { course };
};

const getCourseIdParam = (courseIdParam: string | string[]) => {
  return Array.isArray(courseIdParam) ? courseIdParam[0] : courseIdParam;
};

export const createCourseSection = async (
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

  const courseId = getCourseIdParam(req.params.courseId);

  const result = await getCourseForContentManagement(
    courseId,
    user.id,
    user.role
  );

  if ('error' in result && result.error) {
    res.status(result.error.statusCode).json({
      success: false,
      message: result.error.message,
    });
    return;
  }

  if (
    result.course.status !== 'DRAFT' &&
    result.course.status !== 'REJECTED' &&
    user.role !== 'ADMIN'
  ) {
    res.status(403).json({
      success: false,
      message: 'Only draft or rejected courses can be updated',
    });
    return;
  }

  const validation = createSectionSchema.safeParse(req.body);

  if (!validation.success) {
    res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: validation.error.flatten().fieldErrors,
    });
    return;
  }

  const existingSection = await CourseSection.findOne({
    courseId: new Types.ObjectId(courseId),
    order: validation.data.order,
  }).lean();

  if (existingSection) {
    res.status(409).json({
      success: false,
      message: 'A section already exists at this order',
    });
    return;
  }

  const section = await CourseSection.create({
    courseId: new Types.ObjectId(courseId),
    title: validation.data.title,
    order: validation.data.order,
  });

  res.status(201).json({
    success: true,
    message: 'Section created successfully',
    data: section,
  });
};

// Function to get course content (sections and lessons)
export const getCourseContent = async (
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

  const courseId = getCourseIdParam(req.params.courseId);

  const result = await getCourseForContentManagement(
    courseId,
    user.id,
    user.role
  );

  if ('error' in result && result.error) {
    res.status(result.error.statusCode).json({
      success: false,
      message: result.error.message,
    });
    return;
  }

  const courseObjectId = new Types.ObjectId(courseId);

  const [sections, lessons] = await Promise.all([
    CourseSection.find({ courseId: courseObjectId }).sort({ order: 1 }).lean(),

    Lesson.find({ courseId: courseObjectId }).sort({ order: 1 }).lean(),
  ]);

  const content = sections.map((section) => ({
    ...section,
    lessons: lessons.filter(
      (lesson) => lesson.sectionId.toString() === section._id.toString()
    ),
  }));

  res.status(200).json({
    success: true,
    data: {
      course: {
        _id: result.course._id,
        title: result.course.title,
        status: result.course.status,
      },
      sections: content,
    },
  });
};

export const createLesson = async (
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

  const sectionIdParam = req.params.sectionId;
  const sectionId = Array.isArray(sectionIdParam)
    ? sectionIdParam[0]
    : sectionIdParam;

  if (!Types.ObjectId.isValid(sectionId)) {
    res.status(400).json({
      success: false,
      message: 'Invalid section identifier',
    });
    return;
  }

  const section = await CourseSection.findById(sectionId);

  if (!section) {
    res.status(404).json({
      success: false,
      message: 'Section not found',
    });
    return;
  }

  const courseId = section.courseId.toString();

  const result = await getCourseForContentManagement(
    courseId,
    user.id,
    user.role
  );

  if ('error' in result && result.error) {
    res.status(result.error.statusCode).json({
      success: false,
      message: result.error.message,
    });
    return;
  }

  if (result.course.status !== 'DRAFT' && user.role !== 'ADMIN') {
    res.status(403).json({
      success: false,
      message: 'Only draft courses can be updated',
    });
    return;
  }

  const validation = createLessonSchema.safeParse(req.body);

  if (!validation.success) {
    res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: validation.error.flatten().fieldErrors,
    });
    return;
  }

  const existingLesson = await Lesson.findOne({
    sectionId: new Types.ObjectId(sectionId),
    order: validation.data.order,
  }).lean();

  if (existingLesson) {
    res.status(409).json({
      success: false,
      message: 'A lesson already exists at this order',
    });
    return;
  }

  const lesson = await Lesson.create({
    ...validation.data,
    courseId: section.courseId,
    sectionId: section._id,
    videoUrl:
      validation.data.type === 'VIDEO' ? validation.data.videoUrl : null,
    content:
      validation.data.type === 'ARTICLE' ? validation.data.content : null,
  });

  res.status(201).json({
    success: true,
    message: 'Lesson created successfully',
    data: lesson,
  });
};
