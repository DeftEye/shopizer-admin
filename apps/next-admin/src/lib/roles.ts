import type { RoleFlags, UserGroup } from "./types";

/** Same group names the Angular UserService.checkForAccess maps. */
const ORDER_ACCESS_GROUPS = new Set([
  "STORE_ADMIN",
  "SUPERADMIN",
  "ADMIN",
  "ORDER",
]);

export function emptyRoles(): RoleFlags {
  return {
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
}

export function rolesFromGroups(groups: UserGroup[] | undefined): RoleFlags {
  const roles = emptyRoles();
  for (const group of groups ?? []) {
    const name = group?.name;
    if (!name) continue;
    if (ORDER_ACCESS_GROUPS.has(name)) {
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
