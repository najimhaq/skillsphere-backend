//src/types/auth.ts
export const USER_ROLES = ['STUDENT', 'INSTRUCTOR', 'ADMIN'] as const;

export type UserRole = (typeof USER_ROLES)[number];

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

export const isUserRole = (value: unknown): value is UserRole => {
  return typeof value === 'string' && USER_ROLES.includes(value as UserRole);
};
