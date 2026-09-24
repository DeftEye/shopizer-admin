/** Mirrors Angular `src/app/pages/shared/models/user.ts`. */
export type ShopizerUser = {
  id?: number;
  userName?: string;
  emailAddress?: string;
  firstName?: string;
  lastName?: string;
  lastAccess?: string;
  defaultLanguage?: string;
  merchant?: string;
  groups?: Array<{ name?: string }>;
};

/** `POST /v1/private/login` body — Angular `AuthService.login`. */
export type LoginRequest = {
  username: string;
  password: string;
};

/** Observed Angular usage: `res.token`, `res.id`. */
export type LoginResponse = {
  token: string;
  id?: number | string;
};

export type AccessRoles = {
  canAccessToOrder: boolean;
  isSuperadmin: boolean;
  isAdmin: boolean;
  isAdminCatalogue: boolean;
  isAdminStore: boolean;
  isAdminOrder: boolean;
  isAdminContent: boolean;
  isCustomer: boolean;
  isAdminRetail: boolean;
};

export const EMPTY_ROLES: AccessRoles = {
  canAccessToOrder: false,
  isSuperadmin: false,
  isAdmin: false,
  isAdminCatalogue: false,
  isAdminStore: false,
  isAdminOrder: false,
  isAdminContent: false,
  isCustomer: false,
  isAdminRetail: false,
};
