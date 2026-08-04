import mongoose from 'mongoose';

import {
  PLATFORM_CURRENCIES,
  type IPlatformSettings,
} from '../../types/admin/platform-settings.js';

const platformSettingsSchema = new mongoose.Schema<IPlatformSettings>(
  {
    key: {
      type: String,
      enum: ['PLATFORM'],
      required: true,
      unique: true,
      default: 'PLATFORM',
      immutable: true,
    },

    platformName: {
      type: String,
      required: true,
      trim: true,
      minlength: 2,
      maxlength: 100,
      default: 'SkillSphere',
    },

    supportEmail: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
      maxlength: 254,
      default: 'support@skillsphere.com',
    },

    defaultCurrency: {
      type: String,
      enum: PLATFORM_CURRENCIES,
      required: true,
      default: 'USD',
    },

    allowNewEnrollments: {
      type: Boolean,
      required: true,
      default: true,
    },

    maintenanceMode: {
      type: Boolean,
      required: true,
      default: false,
    },

    maintenanceMessage: {
      type: String,
      trim: true,
      maxlength: 500,
      default:
        'SkillSphere is temporarily under maintenance. Please check back soon.',
    },

    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'user',
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

export const PlatformSettings =
  mongoose.models.PlatformSettings ||
  mongoose.model<IPlatformSettings>('PlatformSettings', platformSettingsSchema);
