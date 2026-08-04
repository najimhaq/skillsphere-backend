import type { Request, Response } from 'express';
import type { ParsedQs } from 'qs';
import { ObjectId } from 'mongodb';

import { client } from '../../config/mongo-client.js';
import {
  isAccountStatus,
  isUserRole,
  type AccountStatus,
  type UserRole,
} from '../../types/auth.js';

type UserDocument = {
  _id: ObjectId;
  name: string;
  email: string;
  emailVerified: boolean;
  image?: string | null;
  role?: UserRole;
  accountStatus?: AccountStatus;
  createdAt: Date;
  updatedAt: Date;
};

const db = client.db('skillsphere');
const usersCollection = db.collection<UserDocument>('user');

const MAX_PAGE_SIZE = 50;
const DEFAULT_PAGE_SIZE = 10;

const getSingleQueryValue = (
  value: string | string[] | ParsedQs | Array<string | ParsedQs> | undefined
): string | undefined => {
  if (Array.isArray(value)) {
    const firstValue = value[0];
    return typeof firstValue === 'string' ? firstValue : undefined;
  }

  return typeof value === 'string' ? value : undefined;
};

const parsePositiveInteger = (
  value: string | undefined,
  fallback: number,
  maximum?: number
) => {
  const parsedValue = Number.parseInt(value ?? '', 10);

  if (!Number.isInteger(parsedValue) || parsedValue < 1) {
    return fallback;
  }

  if (maximum && parsedValue > maximum) {
    return maximum;
  }

  return parsedValue;
};

const escapeRegex = (value: string) => {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
};

const getUserIdParam = (userIdParam: string | string[]) => {
  return Array.isArray(userIdParam) ? userIdParam[0] : userIdParam;
};

export const getAdminUsers = async (
  req: Request,
  res: Response
): Promise<void> => {
  const page = parsePositiveInteger(getSingleQueryValue(req.query.page), 1);

  const limit = parsePositiveInteger(
    getSingleQueryValue(req.query.limit),
    DEFAULT_PAGE_SIZE,
    MAX_PAGE_SIZE
  );

  const roleQuery = getSingleQueryValue(req.query.role);
  const accountStatusQuery = getSingleQueryValue(req.query.accountStatus);
  const searchQuery = getSingleQueryValue(req.query.search)?.trim() ?? '';

  if (roleQuery && roleQuery !== 'ALL' && !isUserRole(roleQuery)) {
    res.status(400).json({
      success: false,
      message: 'Invalid role filter.',
    });
    return;
  }

  if (
    accountStatusQuery &&
    accountStatusQuery !== 'ALL' &&
    !isAccountStatus(accountStatusQuery)
  ) {
    res.status(400).json({
      success: false,
      message: 'Invalid account-status filter.',
    });
    return;
  }

  const filter: Record<string, unknown> = {};

  if (roleQuery && roleQuery !== 'ALL') {
    filter.role = roleQuery;
  }

  if (accountStatusQuery && accountStatusQuery !== 'ALL') {
    if (accountStatusQuery === 'ACTIVE') {
      filter.$or = [
        { accountStatus: 'ACTIVE' },
        { accountStatus: { $exists: false } },
        { accountStatus: null },
      ];
    } else {
      filter.accountStatus = accountStatusQuery;
    }
  }

  if (searchQuery) {
    const searchPattern = new RegExp(escapeRegex(searchQuery), 'i');

    const searchFilter = {
      $or: [{ name: searchPattern }, { email: searchPattern }],
    };

    if (filter.$or) {
      filter.$and = [{ $or: filter.$or }, searchFilter];

      delete filter.$or;
    } else {
      Object.assign(filter, searchFilter);
    }
  }

  const skip = (page - 1) * limit;

  const [users, total] = await Promise.all([
    usersCollection
      .find(filter)
      .project({
        name: 1,
        email: 1,
        emailVerified: 1,
        image: 1,
        role: 1,
        accountStatus: 1,
        createdAt: 1,
        updatedAt: 1,
      })
      .sort({
        createdAt: -1,
        _id: -1,
      })
      .skip(skip)
      .limit(limit)
      .toArray(),

    usersCollection.countDocuments(filter),
  ]);

  const normalizedUsers = users.map((user) => ({
    _id: user._id.toString(),
    name: user.name,
    email: user.email,
    emailVerified: user.emailVerified,
    image: user.image ?? null,
    role: user.role ?? 'STUDENT',
    accountStatus: user.accountStatus ?? 'ACTIVE',
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  }));

  res.status(200).json({
    success: true,
    data: normalizedUsers,
    meta: {
      page,
      limit,
      total,
      totalPages: Math.max(1, Math.ceil(total / limit)),
    },
  });
};

export const updateAdminUserRole = async (
  req: Request,
  res: Response
): Promise<void> => {
  const userId = getUserIdParam(req.params.userId);
  const role = req.body?.role as unknown;
  const currentAdminId = req.authUser?.id;

  if (!currentAdminId) {
    res.status(401).json({
      success: false,
      message: 'Authentication required.',
    });
    return;
  }

  if (!ObjectId.isValid(userId)) {
    res.status(400).json({
      success: false,
      message: 'Invalid user identifier.',
    });
    return;
  }

  if (!isUserRole(role)) {
    res.status(400).json({
      success: false,
      message: 'Invalid role. Use STUDENT, INSTRUCTOR, or ADMIN.',
    });
    return;
  }

  const targetUserObjectId = new ObjectId(userId);

  if (targetUserObjectId.toString() === currentAdminId) {
    res.status(400).json({
      success: false,
      message: 'You cannot change your own role.',
    });
    return;
  }

  const targetUser = await usersCollection.findOne({
    _id: targetUserObjectId,
  });

  if (!targetUser) {
    res.status(404).json({
      success: false,
      message: 'User not found.',
    });
    return;
  }

  const targetCurrentRole = targetUser.role ?? 'STUDENT';

  if (targetCurrentRole === role) {
    res.status(400).json({
      success: false,
      message: 'This user already has the selected role.',
    });
    return;
  }

  if (targetCurrentRole === 'ADMIN' && role !== 'ADMIN') {
    const totalAdmins = await usersCollection.countDocuments({
      role: 'ADMIN',
    });

    if (totalAdmins <= 1) {
      res.status(400).json({
        success: false,
        message: 'You cannot remove the final administrator role.',
      });
      return;
    }
  }

  await usersCollection.updateOne(
    {
      _id: targetUserObjectId,
    },
    {
      $set: {
        role,
        updatedAt: new Date(),
      },
    }
  );

  const updatedUser = await usersCollection.findOne(
    {
      _id: targetUserObjectId,
    },
    {
      projection: {
        name: 1,
        email: 1,
        emailVerified: 1,
        image: 1,
        role: 1,
        accountStatus: 1,
        createdAt: 1,
        updatedAt: 1,
      },
    }
  );

  res.status(200).json({
    success: true,
    message: 'User role updated successfully.',
    data: {
      _id: updatedUser?._id.toString(),
      name: updatedUser?.name,
      email: updatedUser?.email,
      emailVerified: updatedUser?.emailVerified,
      image: updatedUser?.image ?? null,
      role: updatedUser?.role ?? 'STUDENT',
      accountStatus: updatedUser?.accountStatus ?? 'ACTIVE',
      createdAt: updatedUser?.createdAt,
      updatedAt: updatedUser?.updatedAt,
    },
  });
};

export const updateAdminUserAccountStatus = async (
  req: Request,
  res: Response
): Promise<void> => {
  const userId = getUserIdParam(req.params.userId);
  const accountStatus = req.body?.accountStatus as unknown;
  const currentAdminId = req.authUser?.id;

  if (!currentAdminId) {
    res.status(401).json({
      success: false,
      message: 'Authentication required.',
    });
    return;
  }

  if (!ObjectId.isValid(userId)) {
    res.status(400).json({
      success: false,
      message: 'Invalid user identifier.',
    });
    return;
  }

  if (!isAccountStatus(accountStatus)) {
    res.status(400).json({
      success: false,
      message: 'Invalid account status. Use ACTIVE or SUSPENDED.',
    });
    return;
  }

  const targetUserObjectId = new ObjectId(userId);

  if (targetUserObjectId.toString() === currentAdminId) {
    res.status(400).json({
      success: false,
      message: 'You cannot change your own account status.',
    });
    return;
  }

  const targetUser = await usersCollection.findOne({
    _id: targetUserObjectId,
  });

  if (!targetUser) {
    res.status(404).json({
      success: false,
      message: 'User not found.',
    });
    return;
  }

  const currentStatus = targetUser.accountStatus ?? 'ACTIVE';

  if (currentStatus === accountStatus) {
    res.status(400).json({
      success: false,
      message: `This user is already ${accountStatus.toLowerCase()}.`,
    });
    return;
  }

  if (targetUser.role === 'ADMIN' && accountStatus === 'SUSPENDED') {
    const activeAdmins = await usersCollection.countDocuments({
      role: 'ADMIN',
      $or: [
        { accountStatus: 'ACTIVE' },
        { accountStatus: { $exists: false } },
        { accountStatus: { $in: [null] } },
      ],
    } as any);

    if (activeAdmins <= 1) {
      res.status(400).json({
        success: false,
        message: 'You cannot suspend the final active administrator.',
      });
      return;
    }
  }

  await usersCollection.updateOne(
    {
      _id: targetUserObjectId,
    },
    {
      $set: {
        accountStatus,
        updatedAt: new Date(),
      },
    }
  );

  const updatedUser = await usersCollection.findOne(
    {
      _id: targetUserObjectId,
    },
    {
      projection: {
        name: 1,
        email: 1,
        emailVerified: 1,
        image: 1,
        role: 1,
        accountStatus: 1,
        createdAt: 1,
        updatedAt: 1,
      },
    }
  );

  res.status(200).json({
    success: true,
    message:
      accountStatus === 'SUSPENDED'
        ? 'User suspended successfully.'
        : 'User reactivated successfully.',
    data: {
      _id: updatedUser?._id.toString(),
      name: updatedUser?.name,
      email: updatedUser?.email,
      emailVerified: updatedUser?.emailVerified,
      image: updatedUser?.image ?? null,
      role: updatedUser?.role ?? 'STUDENT',
      accountStatus: updatedUser?.accountStatus ?? 'ACTIVE',
      createdAt: updatedUser?.createdAt,
      updatedAt: updatedUser?.updatedAt,
    },
  });
};
