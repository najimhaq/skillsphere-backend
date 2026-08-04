import type { Types } from 'mongoose';

export const PLATFORM_CURRENCIES = ['USD', 'BDT', 'EUR', 'GBP'] as const;

export type PlatformCurrency = (typeof PLATFORM_CURRENCIES)[number];

export interface IPlatformSettings {
  key: 'PLATFORM';

  platformName: string;
  supportEmail: string;
  defaultCurrency: PlatformCurrency;

  allowNewEnrollments: boolean;

  maintenanceMode: boolean;
  maintenanceMessage: string;

  updatedBy: Types.ObjectId | null;

  createdAt: Date;
  updatedAt: Date;
}
