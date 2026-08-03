import { Types } from 'mongoose';
import type { Request, Response } from 'express';

import { Course } from '../models/course.model.js';
import { CourseSection } from '../models/course-section.model.js';
import { Enrollment } from '../models/enrollment.model.js';
import { Lesson } from '../models/lesson.model.js';

const getCourseIdParam = (courseIdParam: string | string[]) => {
  return Array.isArray(courseIdParam) ? courseIdParam[0] : courseIdParam;
};

export const getEnrolledCourseLearningContent = async (
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
      message: 'Only students can access course learning content',
    });
    return;
  }

  const courseId = getCourseIdParam(req.params.courseId);

  if (!Types.ObjectId.isValid(courseId)) {
    res.status(400).json({
      success: false,
      message: 'Invalid course identifier',
    });
    return;
  }

  const courseObjectId = new Types.ObjectId(courseId);

  const [course, enrollment] = await Promise.all([
    Course.findOne({
      _id: courseObjectId,
      status: 'PUBLISHED',
    }).lean(),

    Enrollment.findOne({
      studentId: new Types.ObjectId(user.id),
      courseId: courseObjectId,
      status: 'ACTIVE',
    }).lean(),
  ]);

  if (!course) {
    res.status(404).json({
      success: false,
      message: 'Published course not found',
    });
    return;
  }

  if (!enrollment) {
    res.status(403).json({
      success: false,
      message: 'Enroll in this course to access its learning content',
    });
    return;
  }

  const [sections, lessons] = await Promise.all([
    CourseSection.find({ courseId: courseObjectId })
      .sort({ order: 1, _id: 1 })
      .lean(),

    Lesson.find({ courseId: courseObjectId })
      .sort({ sectionId: 1, order: 1, _id: 1 })
      .lean(),
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
        _id: course._id,
        title: course.title,
        slug: course.slug,
        shortDescription: course.shortDescription,
        thumbnailUrl: course.thumbnailUrl,
        category: course.category,
        level: course.level,
      },
      enrollment: {
        _id: enrollment._id,
        progressPercentage: enrollment.progressPercentage,
        status: enrollment.status,
        enrolledAt: enrollment.enrolledAt,
      },
      sections: content,
    },
  });
};
