import type { Request, Response } from 'express';
import { ObjectId, type WithId, type Document } from 'mongodb';
import { Types } from 'mongoose';

import { client } from '../config/mongo-client.js';
import { Course } from '../models/course.model.js';
import { Enrollment } from '../models/enrollment.model.js';

type BetterAuthUser = WithId<
  Document & {
    name: string;
    email: string;
    image?: string | null;
  }
>;

type PopulatedCourse = {
  _id: Types.ObjectId;
  title: string;
};

type InstructorStudent = {
  enrollmentId: string;
  student: {
    id: string;
    name: string;
    email: string;
    image: string | null;
  };
  course: {
    id: string;
    title: string;
  };
  status: 'ACTIVE' | 'COMPLETED' | 'CANCELLED';
  progressPercentage: number;
  enrolledAt: Date;
  completedAt: Date | null;
};

export const getInstructorStudents = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const instructorId = req.authUser?.id;

    if (!instructorId) {
      res.status(401).json({
        success: false,
        message: 'Authentication required',
      });
      return;
    }

    const requestedCourseId =
      typeof req.query.courseId === 'string' ? req.query.courseId : undefined;

    const search =
      typeof req.query.search === 'string'
        ? req.query.search.trim().toLowerCase()
        : '';

    if (requestedCourseId && !Types.ObjectId.isValid(requestedCourseId)) {
      res.status(400).json({
        success: false,
        message: 'Invalid course ID',
      });
      return;
    }

    const instructorCourses = await Course.find({
      instructorId,
    })
      .select('_id title')
      .sort({ createdAt: -1 })
      .lean();

    const allowedCourseIds = instructorCourses.map((course) => course._id);

    if (requestedCourseId) {
      const ownsCourse = allowedCourseIds.some(
        (courseId) => courseId.toString() === requestedCourseId
      );

      if (!ownsCourse) {
        res.status(403).json({
          success: false,
          message: 'You do not have access to this course',
        });
        return;
      }
    }

    if (allowedCourseIds.length === 0) {
      res.status(200).json({
        success: true,
        data: {
          summary: {
            totalStudents: 0,
            activeEnrollments: 0,
            completedEnrollments: 0,
            completionRate: 0,
          },
          courses: [],
          students: [],
        },
      });
      return;
    }

    const courseFilter = requestedCourseId
      ? new Types.ObjectId(requestedCourseId)
      : { $in: allowedCourseIds };

    const enrollments = await Enrollment.find({
      courseId: courseFilter,
    })
      .populate({
        path: 'courseId',
        select: 'title',
      })
      .sort({ enrolledAt: -1 })
      .lean();

    const studentObjectIds = enrollments
      .map((enrollment) => enrollment.studentId)
      .filter((studentId): studentId is Types.ObjectId => Boolean(studentId))
      .map((studentId) => new ObjectId(studentId.toString()));

    const users = await client
      .db('skillsphere')
      .collection<BetterAuthUser>('user')
      .find(
        {
          _id: {
            $in: studentObjectIds,
          },
        },
        {
          projection: {
            name: 1,
            email: 1,
            image: 1,
          },
        }
      )
      .toArray();

    const usersById = new Map(users.map((user) => [user._id.toString(), user]));

    const students: InstructorStudent[] = enrollments
      .map((enrollment) => {
        const studentId = enrollment.studentId?.toString();
        const student = studentId ? usersById.get(studentId) : undefined;

        const course = enrollment.courseId as unknown as PopulatedCourse | null;

        if (!student || !course) {
          return null;
        }

        const studentName = student.name ?? 'Unknown student';
        const studentEmail = student.email ?? '';

        const matchesSearch =
          !search ||
          studentName.toLowerCase().includes(search) ||
          studentEmail.toLowerCase().includes(search);

        if (!matchesSearch) {
          return null;
        }

        return {
          enrollmentId: enrollment._id.toString(),
          student: {
            id: student._id.toString(),
            name: studentName,
            email: studentEmail,
            image: student.image ?? null,
          },
          course: {
            id: course._id.toString(),
            title: course.title,
          },
          status: enrollment.status,
          progressPercentage: enrollment.progressPercentage ?? 0,
          enrolledAt: enrollment.enrolledAt,
          completedAt: enrollment.completedAt ?? null,
        };
      })
      .filter((student): student is InstructorStudent => student !== null);

    const totalStudents = students.length;

    const activeEnrollments = students.filter(
      (student) => student.status === 'ACTIVE'
    ).length;

    const completedEnrollments = students.filter(
      (student) => student.status === 'COMPLETED'
    ).length;

    const completionRate =
      totalStudents === 0
        ? 0
        : Math.round((completedEnrollments / totalStudents) * 100);

    res.status(200).json({
      success: true,
      data: {
        summary: {
          totalStudents,
          activeEnrollments,
          completedEnrollments,
          completionRate,
        },
        courses: instructorCourses.map((course) => ({
          id: course._id.toString(),
          title: course.title,
        })),
        students,
      },
    });
  } catch (error: unknown) {
    const message =
      error instanceof Error
        ? error.message
        : 'Unable to load instructor students';

    console.error(`Get instructor students error: ${message}`);

    res.status(500).json({
      success: false,
      message: 'Unable to load instructor students',
    });
  }
};
