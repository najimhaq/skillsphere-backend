import type { Request, Response } from 'express';
import { ObjectId } from 'mongodb';

import { client } from '../../config/mongo-client.js';

type BetterAuthUser = {
  _id: ObjectId;
  name?: string;
  email?: string;
  image?: string | null;
  role?: string;
  createdAt?: Date;
  updatedAt?: Date;
};

type ProfileUpdateBody = {
  name?: unknown;
};

const getAdminUser = async (userId: string) => {
  if (!ObjectId.isValid(userId)) {
    return null;
  }

  return client
    .db('skillsphere')
    .collection<BetterAuthUser>('user')
    .findOne(
      {
        _id: new ObjectId(userId),
      },
      {
        projection: {
          name: 1,
          email: 1,
          image: 1,
          role: 1,
          createdAt: 1,
          updatedAt: 1,
        },
      }
    );
};

const profileResponse = (user: BetterAuthUser) => {
  return {
    id: user._id.toString(),
    name: user.name ?? '',
    email: user.email ?? '',
    image: user.image ?? null,
    role: user.role ?? 'ADMIN',
    createdAt: user.createdAt ?? null,
    updatedAt: user.updatedAt ?? null,
  };
};

export const getAdminProfile = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const userId = req.authUser?.id;

    if (!userId) {
      res.status(401).json({
        success: false,
        message: 'Authentication required.',
      });
      return;
    }

    const user = await getAdminUser(userId);

    if (!user) {
      res.status(404).json({
        success: false,
        message: 'Admin profile could not be found.',
      });
      return;
    }

    res.status(200).json({
      success: true,
      data: profileResponse(user),
    });
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : 'Unable to load admin profile.';

    console.error(`Get admin profile error: ${message}`);

    res.status(500).json({
      success: false,
      message: 'Unable to load admin profile.',
    });
  }
};

export const updateAdminProfile = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const userId = req.authUser?.id;
    const body = req.body as ProfileUpdateBody;

    if (!userId) {
      res.status(401).json({
        success: false,
        message: 'Authentication required.',
      });
      return;
    }

    if (!ObjectId.isValid(userId)) {
      res.status(400).json({
        success: false,
        message: 'Invalid admin identifier.',
      });
      return;
    }

    if (!('name' in body) || typeof body.name !== 'string') {
      res.status(400).json({
        success: false,
        message: 'Name must be text.',
      });
      return;
    }

    const name = body.name.trim();

    if (name.length < 2 || name.length > 100) {
      res.status(400).json({
        success: false,
        message: 'Name must be between 2 and 100 characters.',
      });
      return;
    }

    const userResult = await client
      .db('skillsphere')
      .collection<BetterAuthUser>('user')
      .findOneAndUpdate(
        {
          _id: new ObjectId(userId),
        },
        {
          $set: {
            name,
            updatedAt: new Date(),
          },
        },
        {
          returnDocument: 'after',
          projection: {
            name: 1,
            email: 1,
            image: 1,
            role: 1,
            createdAt: 1,
            updatedAt: 1,
          },
        }
      );

    if (!userResult) {
      res.status(404).json({
        success: false,
        message: 'Admin profile could not be found.',
      });
      return;
    }

    res.status(200).json({
      success: true,
      message: 'Profile updated successfully.',
      data: profileResponse(userResult),
    });
  } catch (error: unknown) {
    const message =
      error instanceof Error
        ? error.message
        : 'Unable to update admin profile.';

    console.error(`Update admin profile error: ${message}`);

    res.status(500).json({
      success: false,
      message: 'Unable to update admin profile.',
    });
  }
};

export const uploadAdminProfileImage = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const userId = req.authUser?.id;

    if (!userId) {
      res.status(401).json({
        success: false,
        message: 'Authentication required.',
      });
      return;
    }

    if (!ObjectId.isValid(userId)) {
      res.status(400).json({
        success: false,
        message: 'Invalid admin identifier.',
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

    uploadFormData.append('name', `skillsphere-admin-${userId}-${Date.now()}`);

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
        `ImgBB upload failed: ${
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
      .collection<BetterAuthUser>('user')
      .findOneAndUpdate(
        {
          _id: new ObjectId(userId),
        },
        {
          $set: {
            image: imageUrl,
            updatedAt: new Date(),
          },
        },
        {
          returnDocument: 'after',
          projection: {
            name: 1,
            email: 1,
            image: 1,
            role: 1,
            createdAt: 1,
            updatedAt: 1,
          },
        }
      );

    if (!userResult) {
      res.status(404).json({
        success: false,
        message: 'Admin profile could not be found.',
      });
      return;
    }

    res.status(200).json({
      success: true,
      message: 'Profile image updated successfully.',
      data: profileResponse(userResult),
    });
  } catch (error: unknown) {
    const message =
      error instanceof Error
        ? error.message
        : 'Unable to upload profile image.';

    console.error(`Upload admin profile image error: ${message}`);

    res.status(400).json({
      success: false,
      message:
        message === 'Only JPEG, PNG, and WebP image files are allowed.'
          ? message
          : 'Unable to upload profile image.',
    });
  }
};
