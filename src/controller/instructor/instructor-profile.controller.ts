import type { Request, Response } from 'express';
import { Types } from 'mongoose';
import { client } from '../../config/mongo-client.js';
import { InstructorProfile } from '../../models/instructor/instructor-profile.model.js';

type BetterAuthUser = {
  _id: Types.ObjectId;
  name?: string;
  email?: string;
  image?: string | null;
};

type ProfileUpdateBody = {
  headline?: unknown;
  bio?: unknown;
  expertise?: unknown;
  website?: unknown;
  linkedinUrl?: unknown;
  githubUrl?: unknown;
};

type SettingsUpdateBody = {
  notifyNewEnrollment?: unknown;
  notifyCourseReview?: unknown;
  notifyStudentCompletion?: unknown;
};

const asTrimmedString = (
  value: unknown,
  fieldName: string,
  maxLength: number
): string | null => {
  if (typeof value !== 'string') {
    return null;
  }

  const result = value.trim();

  if (result.length > maxLength) {
    throw new Error(`${fieldName} must be at most ${maxLength} characters.`);
  }

  return result;
};

const asOptionalUrl = (value: unknown, fieldName: string): string | null => {
  const result = asTrimmedString(value, fieldName, 300);

  if (result === null || result === '') {
    return result;
  }

  try {
    const url = new URL(result);

    if (url.protocol !== 'https:' && url.protocol !== 'http:') {
      throw new Error();
    }

    return url.toString();
  } catch {
    throw new Error(`${fieldName} must be a valid HTTP or HTTPS URL.`);
  }
};

const asExpertise = (value: unknown): string[] => {
  if (!Array.isArray(value)) {
    throw new Error('Expertise must be an array.');
  }

  if (value.length > 12) {
    throw new Error('You can add up to 12 expertise items.');
  }

  const items = value.map((item) => {
    if (typeof item !== 'string') {
      throw new Error('Every expertise item must be text.');
    }

    const trimmedItem = item.trim();

    if (!trimmedItem) {
      throw new Error('Expertise items cannot be empty.');
    }

    if (trimmedItem.length > 40) {
      throw new Error('Each expertise item must be at most 40 characters.');
    }

    return trimmedItem;
  });

  return [...new Set(items)];
};

const asBoolean = (value: unknown, fieldName: string): boolean => {
  if (typeof value !== 'boolean') {
    throw new Error(`${fieldName} must be true or false.`);
  }

  return value;
};

const getUserFromBetterAuth = async (userId: string) => {
  if (!Types.ObjectId.isValid(userId)) {
    return null;
  }

  return client
    .db('skillsphere')
    .collection<BetterAuthUser>('user')
    .findOne(
      {
        _id: new Types.ObjectId(userId),
      },
      {
        projection: {
          name: 1,
          email: 1,
          image: 1,
        },
      }
    );
};

const getOrCreateProfile = async (userId: string) => {
  return InstructorProfile.findOneAndUpdate(
    {
      userId: new Types.ObjectId(userId),
    },
    {
      $setOnInsert: {
        userId: new Types.ObjectId(userId),
      },
    },
    {
      returnDocument: 'after',
      upsert: true,
      runValidators: true,
    }
  );
};

const profileResponse = (
  user: BetterAuthUser,
  profile: {
    headline: string;
    bio: string;
    expertise: string[];
    website: string;
    linkedinUrl: string;
    githubUrl: string;
    notifyNewEnrollment: boolean;
    notifyCourseReview: boolean;
    notifyStudentCompletion: boolean;
  }
) => {
  return {
    user: {
      id: user._id.toString(),
      name: user.name ?? '',
      email: user.email ?? '',
      image: user.image ?? null,
    },
    profile: {
      headline: profile.headline,
      bio: profile.bio,
      expertise: profile.expertise,
      website: profile.website,
      linkedinUrl: profile.linkedinUrl,
      githubUrl: profile.githubUrl,
    },
    settings: {
      notifyNewEnrollment: profile.notifyNewEnrollment,
      notifyCourseReview: profile.notifyCourseReview,
      notifyStudentCompletion: profile.notifyStudentCompletion,
    },
  };
};

export const getInstructorProfile = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const userId = req.authUser?.id;

    if (!userId) {
      res.status(401).json({
        success: false,
        message: 'Authentication required',
      });
      return;
    }

    const [user, profile] = await Promise.all([
      getUserFromBetterAuth(userId),
      getOrCreateProfile(userId),
    ]);

    if (!user || !profile) {
      res.status(404).json({
        success: false,
        message: 'Instructor profile could not be found.',
      });
      return;
    }

    res.status(200).json({
      success: true,
      data: profileResponse(user, profile),
    });
  } catch (error: unknown) {
    const message =
      error instanceof Error
        ? error.message
        : 'Unable to load instructor profile.';

    console.error(`Get instructor profile error: ${message}`);

    res.status(500).json({
      success: false,
      message: 'Unable to load instructor profile.',
    });
  }
};

export const updateInstructorProfile = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const userId = req.authUser?.id;

    if (!userId) {
      res.status(401).json({
        success: false,
        message: 'Authentication required',
      });
      return;
    }

    const body = req.body as ProfileUpdateBody;

    const update: Record<string, string | string[]> = {};

    if ('headline' in body) {
      const headline = asTrimmedString(body.headline, 'Headline', 120);

      if (headline === null) {
        throw new Error('Headline must be text.');
      }

      update.headline = headline;
    }

    if ('bio' in body) {
      const bio = asTrimmedString(body.bio, 'Bio', 2000);

      if (bio === null) {
        throw new Error('Bio must be text.');
      }

      update.bio = bio;
    }

    if ('expertise' in body) {
      update.expertise = asExpertise(body.expertise);
    }

    if ('website' in body) {
      const website = asOptionalUrl(body.website, 'Website');

      if (website === null) {
        throw new Error('Website must be text.');
      }

      update.website = website;
    }

    if ('linkedinUrl' in body) {
      const linkedinUrl = asOptionalUrl(body.linkedinUrl, 'LinkedIn URL');

      if (linkedinUrl === null) {
        throw new Error('LinkedIn URL must be text.');
      }

      update.linkedinUrl = linkedinUrl;
    }

    if ('githubUrl' in body) {
      const githubUrl = asOptionalUrl(body.githubUrl, 'GitHub URL');

      if (githubUrl === null) {
        throw new Error('GitHub URL must be text.');
      }

      update.githubUrl = githubUrl;
    }

    const profile = await InstructorProfile.findOneAndUpdate(
      {
        userId: new Types.ObjectId(userId),
      },
      {
        $set: update,
        $setOnInsert: {
          userId: new Types.ObjectId(userId),
        },
      },
      {
        new: true,
        upsert: true,
        runValidators: true,
      }
    );

    const user = await getUserFromBetterAuth(userId);

    if (!user || !profile) {
      res.status(404).json({
        success: false,
        message: 'Instructor profile could not be found.',
      });
      return;
    }

    res.status(200).json({
      success: true,
      message: 'Profile updated successfully.',
      data: profileResponse(user, profile),
    });
  } catch (error: unknown) {
    const message =
      error instanceof Error
        ? error.message
        : 'Unable to update instructor profile.';

    console.error(`Update instructor profile error: ${message}`);

    res.status(400).json({
      success: false,
      message,
    });
  }
};

export const updateInstructorSettings = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const userId = req.authUser?.id;

    if (!userId) {
      res.status(401).json({
        success: false,
        message: 'Authentication required',
      });
      return;
    }

    const body = req.body as SettingsUpdateBody;

    const update: Record<string, boolean> = {};

    if ('notifyNewEnrollment' in body) {
      update.notifyNewEnrollment = asBoolean(
        body.notifyNewEnrollment,
        'New enrollment notification'
      );
    }

    if ('notifyCourseReview' in body) {
      update.notifyCourseReview = asBoolean(
        body.notifyCourseReview,
        'Course review notification'
      );
    }

    if ('notifyStudentCompletion' in body) {
      update.notifyStudentCompletion = asBoolean(
        body.notifyStudentCompletion,
        'Student completion notification'
      );
    }

    const profile = await InstructorProfile.findOneAndUpdate(
      {
        userId: new Types.ObjectId(userId),
      },
      {
        $set: update,
        $setOnInsert: {
          userId: new Types.ObjectId(userId),
        },
      },
      {
         returnDocument: 'after',
        upsert: true,
        runValidators: true,
      }
    );

    const user = await getUserFromBetterAuth(userId);

    if (!user || !profile) {
      res.status(404).json({
        success: false,
        message: 'Instructor settings could not be found.',
      });
      return;
    }

    res.status(200).json({
      success: true,
      message: 'Settings updated successfully.',
      data: profileResponse(user, profile),
    });
  } catch (error: unknown) {
    const message =
      error instanceof Error
        ? error.message
        : 'Unable to update instructor settings.';

    console.error(`Update instructor settings error: ${message}`);

    res.status(400).json({
      success: false,
      message,
    });
  }
};
