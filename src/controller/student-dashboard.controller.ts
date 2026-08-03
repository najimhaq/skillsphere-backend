import type { Request, Response } from 'express';
import { Types } from 'mongoose';

import { Certificate } from '../models/certificate.model.js';
import { Enrollment } from '../models/enrollment.model.js';
import { LessonProgress } from '../models/lesson-progress.model.js';

export const getStudentDashboardOverview = async (
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
      message: 'Only students can access this dashboard',
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

  const [
    coursesEnrolled,
    lessonsCompleted,
    certificatesEarned,
    activeEnrollments,
  ] = await Promise.all([
    Enrollment.countDocuments({
      studentId,
      status: {
        $in: ['ACTIVE', 'COMPLETED'],
      },
    }),

    LessonProgress.countDocuments({
      studentId,
    }),

    Certificate.countDocuments({
      studentId,
    }),

    Enrollment.find({
      studentId,
      status: 'ACTIVE',
    })
      .populate({
        path: 'courseId',
        select: 'title slug shortDescription thumbnailUrl category level',
      })
      .sort({
        updatedAt: -1,
      })
      .limit(3)
      .lean(),
  ]);

  const continueLearning = activeEnrollments
    .filter((enrollment) => enrollment.courseId)
    .map((enrollment) => {
      const course = enrollment.courseId as unknown as {
        _id: Types.ObjectId;
        title: string;
        slug: string;
        shortDescription: string;
        thumbnailUrl: string | null;
        category: string;
        level: string;
      };

      return {
        enrollmentId: enrollment._id,
        courseId: course._id,
        title: course.title,
        slug: course.slug,
        shortDescription: course.shortDescription,
        thumbnailUrl: course.thumbnailUrl,
        category: course.category,
        level: course.level,
        progressPercentage: enrollment.progressPercentage,
        enrolledAt: enrollment.enrolledAt,
        updatedAt: enrollment.updatedAt,
      };
    });

  res.status(200).json({
    success: true,
    data: {
      student: {
        name: user.name,
      },

      stats: {
        coursesEnrolled,
        lessonsCompleted,
        certificatesEarned,
      },

      continueLearning,
    },
  });
};
