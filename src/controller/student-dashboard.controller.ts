//src/controller/student-dashboard.controller.ts
import type { Request, Response } from 'express';
import { Types } from 'mongoose';
import { ObjectId } from 'mongodb';
import { client } from '../config/mongo-client.js';

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


//image upload
export const uploadStudentProfileImage = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
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
        message: 'Only students can upload a student profile image.',
      });
      return;
    }

    if (!Types.ObjectId.isValid(user.id)) {
      res.status(400).json({
        success: false,
        message: 'Invalid student identifier.',
      });
      return;
    }

    if (!req.file) {
      res.status(400).json({
        success: false,
        message: 'Please select a JPEG, PNG, or WebP image under 5 MB.',
      });
      return;
    }

    const imgbbApiKey = process.env.IMGBB_API_KEY;

    if (!imgbbApiKey) {
      console.error('IMGBB_API_KEY is missing.');

      res.status(500).json({
        success: false,
        message: 'Image upload service is not configured.',
      });
      return;
    }

    const uploadFormData = new FormData();

    uploadFormData.append(
      'image',
      new Blob([new Uint8Array(req.file.buffer)], {
        type: req.file.mimetype,
      }),
      req.file.originalname
    );

    uploadFormData.append(
      'name',
      `skillsphere-student-${user.id}-${Date.now()}`
    );

    const imgbbResponse = await fetch(
      `https://api.imgbb.com/1/upload?key=${encodeURIComponent(imgbbApiKey)}`,
      {
        method: 'POST',
        body: uploadFormData,
      }
    );

    const imgbbPayload = (await imgbbResponse.json()) as {
      success?: boolean;
      data?: {
        url?: string;
        display_url?: string;
      };
      error?: {
        message?: string;
      };
    };

    const imageUrl = imgbbPayload.data?.display_url ?? imgbbPayload.data?.url;

    if (!imgbbResponse.ok || !imgbbPayload.success || !imageUrl) {
      console.error(
        `ImgBB student image upload failed: ${
          imgbbPayload.error?.message ?? imgbbResponse.statusText
        }`
      );

      res.status(502).json({
        success: false,
        message: 'Unable to upload image. Please try again.',
      });
      return;
    }

    const userResult = await client
      .db('skillsphere')
      .collection('user')
      .updateOne(
        {
          _id: new ObjectId(user.id),
        },
        {
          $set: {
            image: imageUrl,
            updatedAt: new Date(),
          },
        }
      );

    if (userResult.matchedCount === 0) {
      res.status(404).json({
        success: false,
        message: 'Student account could not be found.',
      });
      return;
    }

    res.status(200).json({
      success: true,
      message: 'Profile image updated successfully.',
      data: {
        image: imageUrl,
      },
    });
  } catch (error: unknown) {
    const message =
      error instanceof Error
        ? error.message
        : 'Unable to update profile image.';

    console.error(`Upload student profile image error: ${message}`);

    res.status(400).json({
      success: false,
      message:
        message === 'Only JPEG, PNG, and WebP image files are allowed.'
          ? message
          : 'Unable to update profile image.',
    });
  }
};
