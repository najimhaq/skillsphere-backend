import type { Request, Response } from 'express';
import { Types } from 'mongoose';

import { PlatformSettings } from '../../models/admin/platform-settings.model.js';
import {
  PLATFORM_CURRENCIES,
  type PlatformCurrency,
} from '../../types/admin/platform-settings.js';
import { createAdminActivityLog } from '../../utils/admin-activity-log.js';

type SettingsUpdateBody = {
  platformName?: unknown;
  supportEmail?: unknown;
  defaultCurrency?: unknown;
  allowNewEnrollments?: unknown;
  maintenanceMode?: unknown;
  maintenanceMessage?: unknown;
};

const DEFAULT_SETTINGS = {
  key: 'PLATFORM' as const,
  platformName: 'SkillSphere',
  supportEmail: 'support@skillsphere.com',
  defaultCurrency: 'USD' as PlatformCurrency,
  allowNewEnrollments: true,
  maintenanceMode: false,
  maintenanceMessage:
    'SkillSphere is temporarily under maintenance. Please check back soon.',
};

const isPlatformCurrency = (value: unknown): value is PlatformCurrency => {
  return (
    typeof value === 'string' &&
    PLATFORM_CURRENCIES.includes(value as PlatformCurrency)
  );
};

const isValidEmail = (value: string) => {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
};

const getOrCreatePlatformSettings = async () => {
  return PlatformSettings.findOneAndUpdate(
    {
      key: 'PLATFORM',
    },
    {
      $setOnInsert: DEFAULT_SETTINGS,
    },
    {
      returnDocument: 'after',
      upsert: true,
      runValidators: true,
    }
  );
};

const settingsResponse = (
  settings: Awaited<ReturnType<typeof getOrCreatePlatformSettings>>
) => {
  if (!settings) {
    return null;
  }

  return {
    id: settings._id.toString(),
    platformName: settings.platformName,
    supportEmail: settings.supportEmail,
    defaultCurrency: settings.defaultCurrency,
    allowNewEnrollments: settings.allowNewEnrollments,
    maintenanceMode: settings.maintenanceMode,
    maintenanceMessage: settings.maintenanceMessage,
    updatedAt: settings.updatedAt,
  };
};

export const getAdminSettings = async (
  _req: Request,
  res: Response
): Promise<void> => {
  const settings = await getOrCreatePlatformSettings();

  if (!settings) {
    res.status(500).json({
      success: false,
      message: 'Unable to load platform settings.',
    });
    return;
  }

  res.status(200).json({
    success: true,
    data: settingsResponse(settings),
  });
};

export const updateAdminSettings = async (
  req: Request,
  res: Response
): Promise<void> => {
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

  const body = req.body as SettingsUpdateBody;
  const currentSettings = await getOrCreatePlatformSettings();

  if (!currentSettings) {
    res.status(500).json({
      success: false,
      message: 'Unable to load platform settings.',
    });
    return;
  }

  const update: Record<string, unknown> = {};
  const previousValue: Record<string, unknown> = {};
  const nextValue: Record<string, unknown> = {};

  if ('platformName' in body) {
    if (typeof body.platformName !== 'string') {
      res.status(400).json({
        success: false,
        message: 'Platform name must be text.',
      });
      return;
    }

    const platformName = body.platformName.trim();

    if (platformName.length < 2 || platformName.length > 100) {
      res.status(400).json({
        success: false,
        message: 'Platform name must be between 2 and 100 characters.',
      });
      return;
    }

    if (platformName !== currentSettings.platformName) {
      update.platformName = platformName;
      previousValue.platformName = currentSettings.platformName;
      nextValue.platformName = platformName;
    }
  }

  if ('supportEmail' in body) {
    if (typeof body.supportEmail !== 'string') {
      res.status(400).json({
        success: false,
        message: 'Support email must be text.',
      });
      return;
    }

    const supportEmail = body.supportEmail.trim().toLowerCase();

    if (!isValidEmail(supportEmail) || supportEmail.length > 254) {
      res.status(400).json({
        success: false,
        message: 'Please provide a valid support email address.',
      });
      return;
    }

    if (supportEmail !== currentSettings.supportEmail) {
      update.supportEmail = supportEmail;
      previousValue.supportEmail = currentSettings.supportEmail;
      nextValue.supportEmail = supportEmail;
    }
  }

  if ('defaultCurrency' in body) {
    if (!isPlatformCurrency(body.defaultCurrency)) {
      res.status(400).json({
        success: false,
        message: 'Invalid currency. Use USD, BDT, EUR, or GBP.',
      });
      return;
    }

    if (body.defaultCurrency !== currentSettings.defaultCurrency) {
      update.defaultCurrency = body.defaultCurrency;
      previousValue.defaultCurrency = currentSettings.defaultCurrency;
      nextValue.defaultCurrency = body.defaultCurrency;
    }
  }

  if ('allowNewEnrollments' in body) {
    if (typeof body.allowNewEnrollments !== 'boolean') {
      res.status(400).json({
        success: false,
        message: 'Allow new enrollments must be true or false.',
      });
      return;
    }

    if (body.allowNewEnrollments !== currentSettings.allowNewEnrollments) {
      update.allowNewEnrollments = body.allowNewEnrollments;
      previousValue.allowNewEnrollments = currentSettings.allowNewEnrollments;
      nextValue.allowNewEnrollments = body.allowNewEnrollments;
    }
  }

  if ('maintenanceMode' in body) {
    if (typeof body.maintenanceMode !== 'boolean') {
      res.status(400).json({
        success: false,
        message: 'Maintenance mode must be true or false.',
      });
      return;
    }

    if (body.maintenanceMode !== currentSettings.maintenanceMode) {
      update.maintenanceMode = body.maintenanceMode;
      previousValue.maintenanceMode = currentSettings.maintenanceMode;
      nextValue.maintenanceMode = body.maintenanceMode;
    }
  }

  if ('maintenanceMessage' in body) {
    if (typeof body.maintenanceMessage !== 'string') {
      res.status(400).json({
        success: false,
        message: 'Maintenance message must be text.',
      });
      return;
    }

    const maintenanceMessage = body.maintenanceMessage.trim();

    if (maintenanceMessage.length < 5 || maintenanceMessage.length > 500) {
      res.status(400).json({
        success: false,
        message: 'Maintenance message must be between 5 and 500 characters.',
      });
      return;
    }

    if (maintenanceMessage !== currentSettings.maintenanceMessage) {
      update.maintenanceMessage = maintenanceMessage;
      previousValue.maintenanceMessage = currentSettings.maintenanceMessage;
      nextValue.maintenanceMessage = maintenanceMessage;
    }
  }

  if (Object.keys(update).length === 0) {
    res.status(200).json({
      success: true,
      message: 'No settings changes were required.',
      data: settingsResponse(currentSettings),
    });
    return;
  }

  update.updatedBy = new Types.ObjectId(admin.id);

  const updatedSettings = await PlatformSettings.findOneAndUpdate(
    {
      key: 'PLATFORM',
    },
    {
      $set: update,
    },
    {

      runValidators: true,
    }
  );

  if (!updatedSettings) {
    res.status(500).json({
      success: false,
      message: 'Unable to update platform settings.',
    });
    return;
  }

  await createAdminActivityLog({
    actor: {
      id: admin.id,
      name: admin.name,
      email: admin.email,
    },

    action: 'PLATFORM_SETTINGS_UPDATED',

    targetType: 'PLATFORM',
    targetId: updatedSettings._id,
    targetName: 'SkillSphere platform settings',

    previousValue,
    nextValue,
  });

  res.status(200).json({
    success: true,
    message: 'Platform settings updated successfully.',
    data: settingsResponse(updatedSettings),
  });
};
