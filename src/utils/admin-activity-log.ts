import { Types } from 'mongoose';

import { AdminActivityLog } from '../models/admin/admin-activity-log.model.js';
import type {
  AdminActivityAction,
  AdminActivityTargetType,
} from '../types/admin/admin-activity-log.js';

type CreateAdminActivityLogInput = {
  actor: {
    id: string;
    name: string;
    email: string;
  };

  action: AdminActivityAction;

  targetType: AdminActivityTargetType;
  targetId: Types.ObjectId | string;
  targetName: string;
  targetEmail?: string | null;

  previousValue?: Record<string, unknown> | null;
  nextValue?: Record<string, unknown> | null;

  note?: string | null;
};

export const createAdminActivityLog = async (
  input: CreateAdminActivityLogInput
): Promise<void> => {
  if (!Types.ObjectId.isValid(input.actor.id)) {
    throw new Error('Invalid admin identifier for activity log.');
  }

  if (!Types.ObjectId.isValid(input.targetId)) {
    throw new Error('Invalid activity-log target identifier.');
  }

  await AdminActivityLog.create({
    actorId: new Types.ObjectId(input.actor.id),
    actorName: input.actor.name,
    actorEmail: input.actor.email,

    action: input.action,

    targetType: input.targetType,
    targetId: new Types.ObjectId(input.targetId),
    targetName: input.targetName,
    targetEmail: input.targetEmail ?? null,

    previousValue: input.previousValue ?? null,
    nextValue: input.nextValue ?? null,

    note: input.note ?? null,
  });
};
