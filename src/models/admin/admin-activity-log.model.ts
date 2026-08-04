// src/models/admin/admin-activity-log.model.ts
import mongoose from 'mongoose';

import {
  ADMIN_ACTIVITY_ACTIONS,
  ADMIN_ACTIVITY_TARGET_TYPES,
  type IAdminActivityLog,
} from '../../types/admin/admin-activity-log.js';

const adminActivityLogSchema = new mongoose.Schema<IAdminActivityLog>(
  {
    actorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'user',
      required: true,
      index: true,
    },

    actorName: {
      type: String,
      required: true,
      trim: true,
    },

    actorEmail: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
    },

    action: {
      type: String,
      enum: ADMIN_ACTIVITY_ACTIONS,
      required: true,
      index: true,
    },

    targetType: {
      type: String,
      enum: ADMIN_ACTIVITY_TARGET_TYPES,
      required: true,
      index: true,
    },

    targetId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      index: true,
    },

    targetName: {
      type: String,
      required: true,
      trim: true,
    },

    targetEmail: {
      type: String,
      trim: true,
      lowercase: true,
      default: null,
    },

    previousValue: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
    },

    nextValue: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
    },

    note: {
      type: String,
      trim: true,
      maxlength: 2000,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

adminActivityLogSchema.index({
  createdAt: -1,
  _id: -1,
});

adminActivityLogSchema.index({
  action: 1,
  createdAt: -1,
});

adminActivityLogSchema.index({
  targetType: 1,
  targetId: 1,
  createdAt: -1,
});

export const AdminActivityLog =
  mongoose.models.AdminActivityLog ||
  mongoose.model<IAdminActivityLog>('AdminActivityLog', adminActivityLogSchema);
