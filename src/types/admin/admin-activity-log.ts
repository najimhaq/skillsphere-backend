import type { Types } from 'mongoose';

export const ADMIN_ACTIVITY_ACTIONS = [
  'COURSE_PUBLISHED',
  'COURSE_REJECTED',
  'COURSE_CHANGES_REQUESTED',
  'USER_ROLE_CHANGED',
  'USER_SUSPENDED',
  'USER_REACTIVATED',
  'PLATFORM_SETTINGS_UPDATED',
] as const;

export type AdminActivityAction = (typeof ADMIN_ACTIVITY_ACTIONS)[number];

export const ADMIN_ACTIVITY_TARGET_TYPES = [
  'COURSE',
  'USER',
  'PLATFORM',
] as const;

export type AdminActivityTargetType =
  (typeof ADMIN_ACTIVITY_TARGET_TYPES)[number];

export interface IAdminActivityLog {
  actorId: Types.ObjectId;
  actorName: string;
  actorEmail: string;

  action: AdminActivityAction;

  targetType: AdminActivityTargetType;
  targetId: Types.ObjectId;
  targetName: string;
  targetEmail?: string | null;

  previousValue?: Record<string, unknown> | null;
  nextValue?: Record<string, unknown> | null;

  note?: string | null;

  createdAt: Date;
  updatedAt: Date;
}
