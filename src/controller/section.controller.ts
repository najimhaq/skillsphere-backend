import { Types } from 'mongoose';
import type { Request, Response } from 'express';

import { Course } from '../models/course.model.js';
import { CourseSection } from '../models/course-section.model.js';
import { Lesson } from '../models/lesson.model.js';
import type { UserRole } from '../types/auth.js';

type SectionManagementError = {
  error: {
    statusCode: number;
    message: string;
  };
};

type SectionManagementSuccess = {
  section: {
    _id: Types.ObjectId;
    courseId: Types.ObjectId;
    title: string;
    order: number;
    save: () => Promise<unknown>;
    deleteOne: () => Promise<unknown>;
  };
  course: {
    _id: Types.ObjectId;
    instructorId: Types.ObjectId;
    status: string;
  };
};

type SectionManagementResult =
  | SectionManagementSuccess
  | SectionManagementError;

const getSectionAndManageableCourse = async (
  sectionId: string,
  userId: string,
  userRole: UserRole
): Promise<SectionManagementResult> => {
  if (!Types.ObjectId.isValid(sectionId)) {
    return {
      error: {
        statusCode: 400,
        message: 'Invalid section identifier',
      },
    };
  }

  const section = await CourseSection.findById(sectionId);

  if (!section) {
    return {
      error: {
        statusCode: 404,
        message: 'Section not found',
      },
    };
  }

  const course = await Course.findById(section.courseId).select(
    '_id instructorId status'
  );

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

  if (course.status !== 'DRAFT') {
    return {
      error: {
        statusCode: 400,
        message: 'Only draft courses can be changed',
      },
    };
  }

  return {
    section,
    course,
  };
};

export const updateSection = async (
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

  const title = req.body?.title;

  if (typeof title !== 'string' || title.trim().length < 2) {
    res.status(400).json({
      success: false,
      message: 'Section title must be at least 2 characters',
    });
    return;
  }

  if (title.trim().length > 120) {
    res.status(400).json({
      success: false,
      message: 'Section title cannot be more than 120 characters',
    });
    return;
  }

  const result = await getSectionAndManageableCourse(
    sectionId,
    user.id,
    user.role
  );

  if ('error' in result) {
    res.status(result.error.statusCode).json({
      success: false,
      message: result.error.message,
    });
    return;
  }

  result.section.title = title.trim();
  await result.section.save();

  res.status(200).json({
    success: true,
    message: 'Section updated successfully',
    data: result.section,
  });
};

export const deleteSection = async (
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

  const result = await getSectionAndManageableCourse(
    sectionId,
    user.id,
    user.role
  );

  if ('error' in result) {
    res.status(result.error.statusCode).json({
      success: false,
      message: result.error.message,
    });
    return;
  }

  const { section, course } = result;

  await Lesson.deleteMany({
    sectionId: section._id,
  });

  await section.deleteOne();

  const remainingSections = await CourseSection.find({
    courseId: course._id,
  }).sort({ order: 1, createdAt: 1 });

  await Promise.all(
    remainingSections.map((item, index) => {
      item.order = index + 1;
      return item.save();
    })
  );

  res.status(200).json({
    success: true,
    message: 'Section and its lessons deleted successfully',
    data: {
      deletedSectionId: sectionId,
    },
  });
};
