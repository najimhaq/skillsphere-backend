import crypto from 'crypto';
import type { Request, Response } from 'express';
import { Types } from 'mongoose';

import { Certificate } from '../models/certificate.model.js';
import { Course } from '../models/course.model.js';
import { Enrollment } from '../models/enrollment.model.js';

const normalizeParam = (value: string | string[]) => {
  return Array.isArray(value) ? value[0] : value;
};

const createCertificateNumber = () => {
  const year = new Date().getFullYear();
  const token = crypto.randomBytes(5).toString('hex').toUpperCase();

  return `SS-${year}-${token}`;
};

const createVerificationCode = () => {
  return crypto.randomBytes(8).toString('hex').toUpperCase();
};

export const issueMyCertificate = async (
  req: Request,
  res: Response
): Promise<void> => {
  const user = req.authUser;
  const courseIdParam = normalizeParam(req.params.courseId);

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
      message: 'Only students can receive course certificates',
    });
    return;
  }

  if (
    !Types.ObjectId.isValid(user.id) ||
    !Types.ObjectId.isValid(courseIdParam)
  ) {
    res.status(400).json({
      success: false,
      message: 'Invalid student or course identifier',
    });
    return;
  }

  const studentId = new Types.ObjectId(user.id);
  const courseId = new Types.ObjectId(courseIdParam);

  const enrollment = await Enrollment.findOne({
    studentId,
    courseId,
    status: 'COMPLETED',
    progressPercentage: 100,
  }).lean();

  if (!enrollment) {
    res.status(403).json({
      success: false,
      message: 'Complete every lesson before requesting a certificate',
    });
    return;
  }

  const existingCertificate = await Certificate.findOne({
    studentId,
    courseId,
  }).lean();

  if (existingCertificate) {
    res.status(200).json({
      success: true,
      message: 'Certificate already issued',
      data: existingCertificate,
    });
    return;
  }

  const course = await Course.findById(courseId).select('title status').lean();

  if (!course) {
    res.status(404).json({
      success: false,
      message: 'Course not found',
    });
    return;
  }

  try {
    const certificate = await Certificate.create({
      studentId,
      courseId,
      enrollmentId: enrollment._id,
      studentName: user.name.trim(),
      courseTitle: course.title,
      certificateNumber: createCertificateNumber(),
      verificationCode: createVerificationCode(),
      issuedAt: enrollment.completedAt ?? new Date(),
    });

    res.status(201).json({
      success: true,
      message: 'Certificate issued successfully',
      data: certificate,
    });
  } catch (error: unknown) {
    if (
      typeof error === 'object' &&
      error !== null &&
      'code' in error &&
      error.code === 11000
    ) {
      const certificate = await Certificate.findOne({
        studentId,
        courseId,
      }).lean();

      res.status(200).json({
        success: true,
        message: 'Certificate already issued',
        data: certificate,
      });
      return;
    }

    throw error;
  }
};

export const getMyCourseCertificate = async (
  req: Request,
  res: Response
): Promise<void> => {
  const user = req.authUser;
  const courseIdParam = normalizeParam(req.params.courseId);

  if (!user) {
    res.status(401).json({
      success: false,
      message: 'Authentication required',
    });
    return;
  }

  if (
    !Types.ObjectId.isValid(user.id) ||
    !Types.ObjectId.isValid(courseIdParam)
  ) {
    res.status(400).json({
      success: false,
      message: 'Invalid student or course identifier',
    });
    return;
  }

  const certificate = await Certificate.findOne({
    studentId: new Types.ObjectId(user.id),
    courseId: new Types.ObjectId(courseIdParam),
  }).lean();

  if (!certificate) {
    res.status(404).json({
      success: false,
      message: 'Certificate not found for this course',
    });
    return;
  }

  res.status(200).json({
    success: true,
    data: certificate,
  });
};

export const verifyCertificate = async (
  req: Request,
  res: Response
): Promise<void> => {
  const verificationCodeParam = normalizeParam(req.params.verificationCode);
  const verificationCode = verificationCodeParam.trim().toUpperCase();

  if (!verificationCode) {
    res.status(400).json({
      success: false,
      message: 'Verification code is required',
    });
    return;
  }

  const certificate = await Certificate.findOne({
    verificationCode,
  })
    .select(
      'studentName courseTitle certificateNumber verificationCode issuedAt'
    )
    .lean();

  if (!certificate) {
    res.status(404).json({
      success: false,
      message: 'Certificate could not be verified',
    });
    return;
  }

  res.status(200).json({
    success: true,
    message: 'Certificate is valid',
    data: certificate,
  });
};
