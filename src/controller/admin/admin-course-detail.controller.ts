import type { Request, Response } from 'express';
import { Types } from 'mongoose';

import { Course } from '../../models/course.model.js';
import { CourseSection } from '../../models/course-section.model.js';
import { Lesson } from '../../models/lesson.model.js';

const getCourseIdParam = (courseIdParam: string | string[]) => {
  return Array.isArray(courseIdParam) ? courseIdParam[0] : courseIdParam;
};

export const getAdminCourseById = async (
  req: Request,
  res: Response
): Promise<void> => {
  const courseId = getCourseIdParam(req.params.courseId);

  if (!Types.ObjectId.isValid(courseId)) {
    res.status(400).json({
      success: false,
      message: 'Invalid course identifier.',
    });
    return;
  }

  const courseObjectId = new Types.ObjectId(courseId);

  const [courseResult, sections, lessons] = await Promise.all([
    Course.aggregate([
      {
        $match: {
          _id: courseObjectId,
        },
      },
      {
        $lookup: {
          from: 'user',
          localField: 'instructorId',
          foreignField: '_id',
          as: 'instructor',
        },
      },
      {
        $unwind: {
          path: '$instructor',
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $project: {
          title: 1,
          slug: 1,
          shortDescription: 1,
          description: 1,
          thumbnailUrl: 1,
          category: 1,
          level: 1,
          price: 1,
          status: 1,
          reviewNote: 1,
          reviewedAt: 1,
          createdAt: 1,
          updatedAt: 1,

          instructor: {
            _id: '$instructor._id',
            name: '$instructor.name',
            email: '$instructor.email',
            image: '$instructor.image',
          },
        },
      },
    ]).exec(),

    CourseSection.find({
      courseId: courseObjectId,
    })
      .sort({ order: 1 })
      .lean(),

    Lesson.find({
      courseId: courseObjectId,
    })
      .sort({ order: 1 })
      .lean(),
  ]);

  const course = courseResult[0];

  if (!course) {
    res.status(404).json({
      success: false,
      message: 'Course not found.',
    });
    return;
  }

  const content = sections.map((section) => ({
    ...section,
    lessons: lessons.filter(
      (lesson) => lesson.sectionId.toString() === section._id.toString()
    ),
  }));

  res.status(200).json({
    success: true,
    data: {
      course,
      sections: content,
    },
  });
};
