import type { Request, Response } from 'express';
import { Types } from 'mongoose';

import { Course } from '../../models/course.model.js';
import { createAdminActivityLog } from '../../utils/admin-activity-log.js';

type ReviewAction = 'PUBLISH' | 'REJECT' | 'REQUEST_CHANGES';

type ReviewRequestBody = {
  action?: ReviewAction;
  reviewNote?: string;
};

const reviewActionMap: Record<
  ReviewAction,
  {
    status: 'PUBLISHED' | 'REJECTED' | 'DRAFT';
    message: string;
    noteRequired: boolean;
  }
> = {
  PUBLISH: {
    status: 'PUBLISHED',
    message: 'Course published successfully.',
    noteRequired: false,
  },

  REJECT: {
    status: 'REJECTED',
    message: 'Course rejected successfully.',
    noteRequired: true,
  },

  REQUEST_CHANGES: {
    status: 'DRAFT',
    message:
      'Changes requested successfully. The course was returned to draft.',
    noteRequired: true,
  },
};

const reviewActionToActivityAction: Record<
  ReviewAction,
  'COURSE_PUBLISHED' | 'COURSE_REJECTED' | 'COURSE_CHANGES_REQUESTED'
> = {
  PUBLISH: 'COURSE_PUBLISHED',
  REJECT: 'COURSE_REJECTED',
  REQUEST_CHANGES: 'COURSE_CHANGES_REQUESTED',
};

export const getAdminCourses = async (
  req: Request,
  res: Response
): Promise<void> => {
  const requestedStatus = String(req.query.status ?? 'PENDING_REVIEW');

  const allowedStatuses = new Set([
    'DRAFT',
    'PENDING_REVIEW',
    'PUBLISHED',
    'REJECTED',
    'ARCHIVED',
  ]);

  if (!allowedStatuses.has(requestedStatus)) {
    res.status(400).json({
      success: false,
      message: 'Invalid course status filter.',
    });
    return;
  }

  const courses = await Course.aggregate([
    {
      $match: {
        status: requestedStatus,
      },
    },
    {
      $sort: {
        updatedAt: -1,
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
  ]).exec();

  res.status(200).json({
    success: true,
    data: courses,
  });
};

export const reviewCourse = async (
  req: Request,
  res: Response
): Promise<void> => {
  const courseIdParam = req.params.courseId;
  const courseId = Array.isArray(courseIdParam)
    ? courseIdParam[0]
    : courseIdParam;

  const { action, reviewNote } = req.body as ReviewRequestBody;
  const admin = req.authUser;

  if (!admin) {
    res.status(401).json({
      success: false,
      message: 'Authentication required.',
    });
    return;
  }

  if (!Types.ObjectId.isValid(admin.id)) {
    res.status(400).json({
      success: false,
      message: 'Invalid admin identifier.',
    });
    return;
  }

  if (!courseId || !Types.ObjectId.isValid(courseId)) {
    res.status(400).json({
      success: false,
      message: 'Invalid course ID.',
    });
    return;
  }

  if (
    action !== 'PUBLISH' &&
    action !== 'REJECT' &&
    action !== 'REQUEST_CHANGES'
  ) {
    res.status(400).json({
      success: false,
      message:
        'Invalid review action. Use PUBLISH, REJECT, or REQUEST_CHANGES.',
    });
    return;
  }

  const actionConfig = reviewActionMap[action];
  const normalizedReviewNote = reviewNote?.trim() ?? '';

  if (actionConfig.noteRequired && normalizedReviewNote.length < 10) {
    res.status(400).json({
      success: false,
      message:
        'Please provide a review note with at least 10 characters for this action.',
    });
    return;
  }

  if (normalizedReviewNote.length > 2000) {
    res.status(400).json({
      success: false,
      message: 'Review note must be 2000 characters or less.',
    });
    return;
  }

  const course = await Course.findOne({
    _id: courseId,
    status: 'PENDING_REVIEW',
  });

  if (!course) {
    res.status(404).json({
      success: false,
      message:
        'Pending-review course not found. It may already have been reviewed.',
    });
    return;
  }

  const previousStatus = course.status;

  course.status = actionConfig.status;
  course.reviewNote = normalizedReviewNote || null;
  course.reviewedBy = new Types.ObjectId(admin.id);
  course.reviewedAt = new Date();

  await course.save();

  await createAdminActivityLog({
    actor: {
      id: admin.id,
      name: admin.name,
      email: admin.email,
    },

    action: reviewActionToActivityAction[action],

    targetType: 'COURSE',
    targetId: course._id,
    targetName: course.title,

    previousValue: {
      status: previousStatus,
    },

    nextValue: {
      status: course.status,
    },

    note: normalizedReviewNote || null,
  });

  res.status(200).json({
    success: true,
    message: actionConfig.message,
    data: course,
  });
};


/*
        { accountStatus: 'ACTIVE' },
        { accountStatus: { $exists: false } },
        { accountStatus: { $in: [null] } },
         */
