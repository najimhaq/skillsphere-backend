//src/types/auth.ts
export const USER_ROLES = ['STUDENT', 'INSTRUCTOR', 'ADMIN'] as const;

export type UserRole = (typeof USER_ROLES)[number];

export const ACCOUNT_STATUSES = ['ACTIVE', 'SUSPENDED'] as const;

export type AccountStatus = (typeof ACCOUNT_STATUSES)[number];

export const isUserRole = (value: unknown): value is UserRole => {
  return typeof value === 'string' && USER_ROLES.includes(value as UserRole);
};

export const isAccountStatus = (value: unknown): value is AccountStatus => {
  return (
    typeof value === 'string' &&
    ACCOUNT_STATUSES.includes(value as AccountStatus)
  );
};

export type AuthenticatedUser = {
  id: string;
  name: string;
  email: string;
  emailVerified: boolean;
  role: UserRole;
};

export type AuthenticatedSession = {
  id: string;
  expiresAt: Date;
};
