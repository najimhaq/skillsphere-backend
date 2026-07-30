export const USER_ROLES = ['STUDENT', 'INSTRUCTOR', 'ADMIN'] as const;

export type UserRole = (typeof USER_ROLES)[number];
export const isUserRole = (value: unknown): value is UserRole => {
  return typeof value === 'string' && USER_ROLES.includes(value as UserRole);
};
