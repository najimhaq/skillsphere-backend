import type { Request, Response } from 'express';

import { getDb } from '../../config/db.js';
import { Course } from '../../models/course.model.js';
import { Enrollment } from '../../models/enrollment.model.js';

type UserRole = 'STUDENT' | 'INSTRUCTOR' | 'ADMIN';

type StatusCount = {
  _id: string;
  count: number;
};

const toCountMap = (items: StatusCount[]): Record<string, number> => {
  return items.reduce<Record<string, number>>((result, item) => {
    result[item._id] = item.count;
    return result;
  }, {});
};

export const getAdminOverview = async (
  _req: Request,
  res: Response
): Promise<void> => {
  const db = getDb();

  const [
    totalUsers,
    usersByRole,
    activeUsers,
    totalCourses,
    coursesByStatus,
    totalEnrollments,
    enrollmentsByStatus,
    recentCourses,
  ] = await Promise.all([
    db.collection('user').countDocuments(),

    db
      .collection<{ role: UserRole }>('user')
      .aggregate<StatusCount>([
        {
          $group: {
            _id: '$role',
            count: {
              $sum: 1,
            },
          },
        },
      ])
      .toArray(),

    db.collection('user').countDocuments({
      status: {
        $ne: 'SUSPENDED',
      },
    }),

    Course.countDocuments(),

    Course.aggregate<StatusCount>([
      {
        $group: {
          _id: '$status',
          count: {
            $sum: 1,
          },
        },
      },
    ]).exec(),

    Enrollment.countDocuments(),

    Enrollment.aggregate<StatusCount>([
      {
        $group: {
          _id: '$status',
          count: {
            $sum: 1,
          },
        },
      },
    ]).exec(),

    Course.aggregate([
      {
        $sort: {
          createdAt: -1,
        },
      },
      {
        $limit: 6,
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
          thumbnailUrl: 1,
          status: 1,
          category: 1,
          level: 1,
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
  ]);

  const roleCounts = toCountMap(usersByRole);
  const courseCounts = toCountMap(coursesByStatus);
  const enrollmentCounts = toCountMap(enrollmentsByStatus);

  res.status(200).json({
    success: true,
    data: {
      users: {
        total: totalUsers,
        active: activeUsers,
        students: roleCounts.STUDENT ?? 0,
        instructors: roleCounts.INSTRUCTOR ?? 0,
        admins: roleCounts.ADMIN ?? 0,
      },

      courses: {
        total: totalCourses,
        draft: courseCounts.DRAFT ?? 0,
        pendingReview: courseCounts.PENDING_REVIEW ?? 0,
        published: courseCounts.PUBLISHED ?? 0,
        rejected: courseCounts.REJECTED ?? 0,
      },

      enrollments: {
        total: totalEnrollments,
        active: enrollmentCounts.ACTIVE ?? 0,
        completed: enrollmentCounts.COMPLETED ?? 0,
        cancelled: enrollmentCounts.CANCELLED ?? 0,
      },

      recentCourses,
    },
  });
};
