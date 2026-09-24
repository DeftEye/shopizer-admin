import { EMPTY_ROLES, type AccessRoles } from "./types.ts";

/**
 * Port of Angular `UserService.checkForAccess` plus the ORDER-group
 * check from `src/app/pages/shared/models/access-roles.ts`.
 */
const ORDER_GROUP_NAMES = new Set(["STORE_ADMIN", "SUPERADMIN", "ADMIN", "ORDER"]);

export function rolesFromGroups(
  groups: Array<{ name?: string }> | undefined,
): AccessRoles {
  const roles: AccessRoles = { ...EMPTY_ROLES };

  for (const group of groups ?? []) {
    const name = group.name;
    if (!name) {
      continue;
    }
    if (ORDER_GROUP_NAMES.has(name)) {
      roles.canAccessToOrder = true;
    }
    switch (name) {
      case "SUPERADMIN":
        roles.isSuperadmin = true;
        break;
      case "ADMIN":
        roles.isAdmin = true;
        break;
      case "ADMIN_CATALOGUE":
        roles.isAdminCatalogue = true;
        break;
      case "ADMIN_STORE":
        roles.isAdminStore = true;
        break;
      case "ADMIN_ORDER":
        roles.isAdminOrder = true;
        break;
      case "ADMIN_CONTENT":
        roles.isAdminContent = true;
        break;
      case "CUSTOMER":
        roles.isCustomer = true;
        break;
      case "ADMIN_RETAIL":
        roles.isAdminRetail = true;
        break;
      default:
        break;
    }
  }

  return roles;
}

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function validateLogin(username: string, password: string): string | null {
  if (!username.trim()) {
    return "Username is required";
  }
  if (!EMAIL_PATTERN.test(username.trim())) {
    return "Username format must be an email";
  }
  if (!password) {
    return "Password is required";
  }
  return null;
}
