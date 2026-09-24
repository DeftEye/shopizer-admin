import type { RoleFlags, UserGroup } from "@/lib/api/types";

/** Port of `src/app/pages/shared/models/access-roles.ts`. */
export const ORDER_ACCESS_ROLES = [
  { id: 1, name: "STORE_ADMIN" },
  { id: 2, name: "SUPERADMIN" },
  { id: 3, name: "ADMIN" },
  { id: 6, name: "ORDER" },
] as const;

export const EMPTY_ROLE_FLAGS: RoleFlags = {
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

/**
 * Port of `UserService.checkForAccess`. Starts from a clean flags object
 * (Angular mutates a service singleton; a fresh object is the same as a
 * new login).
 */
export function checkForAccess(groups: UserGroup[]): RoleFlags {
  const flags: RoleFlags = { ...EMPTY_ROLE_FLAGS };
  const array = groups ?? [];

  ORDER_ACCESS_ROLES.forEach((role) => {
    array.forEach((elem) => {
      if (elem.name === role.name) {
        flags.canAccessToOrder = true;
      }
      switch (elem.name) {
        case "SUPERADMIN":
          flags.isSuperadmin = true;
          break;
        case "ADMIN":
          flags.isAdmin = true;
          break;
        case "ADMIN_CATALOGUE":
          flags.isAdminCatalogue = true;
          break;
        case "ADMIN_STORE":
          flags.isAdminStore = true;
          break;
        case "ADMIN_ORDER":
          flags.isAdminOrder = true;
          break;
        case "ADMIN_CONTENT":
          flags.isAdminContent = true;
          break;
        case "CUSTOMER":
          flags.isCustomer = true;
          break;
        case "ADMIN_RETAIL":
          flags.isAdminRetail = true;
          break;
      }
    });
  });

  return flags;
}

/** `SecurityService` helpers — same boolean expressions as Angular. */
export function isSuperAdmin(flags: RoleFlags): boolean {
  return flags.isSuperadmin;
}

export function isRetailAdmin(flags: RoleFlags): boolean {
  return flags.isSuperadmin || flags.isAdminRetail;
}

export function hasRetailAdminRole(flags: RoleFlags): boolean {
  return flags.isAdminRetail;
}

export function hasAdminRole(flags: RoleFlags): boolean {
  return flags.isAdmin;
}

export function isAnAdmin(flags: RoleFlags): boolean {
  return flags.isSuperadmin || flags.isAdmin || flags.isAdminRetail;
}

/** Menu predicates from `pages-menu.ts` (take flags instead of localStorage). */
export function IsAccessToOrder(flags: RoleFlags): boolean {
  return flags.canAccessToOrder;
}

export function IsSuperadmin(flags: RoleFlags): boolean {
  return flags.isSuperadmin;
}

export function IsAdmin(flags: RoleFlags): boolean {
  return flags.isAdmin || flags.isAdminRetail;
}

export function IsAdminCatalogue(flags: RoleFlags): boolean {
  return flags.isAdminCatalogue;
}

export function IsAdminStore(flags: RoleFlags): boolean {
  return flags.isAdminStore;
}

export function IsAdminOrder(flags: RoleFlags): boolean {
  return flags.isAdminOrder;
}

export function IsAdminContent(flags: RoleFlags): boolean {
  return flags.isAdminContent;
}

export function IsCustomer(flags: RoleFlags): boolean {
  return flags.isCustomer;
}

export function IsAdminRetail(flags: RoleFlags): boolean {
  return flags.isSuperadmin || flags.isAdminRetail || flags.isAdmin;
}

export function isCategoryManagementVisible(
  flags: RoleFlags,
  mode: string,
): boolean {
  if (mode === "MARKETPLACE") {
    return IsSuperadmin(flags);
  }
  return IsAdminRetail(flags) || IsAdmin(flags);
}

export function IsOrderManagementVisible(flags: RoleFlags): boolean {
  return (
    flags.isSuperadmin ||
    flags.isAdminRetail ||
    flags.isAdminOrder ||
    flags.isAdmin
  );
}

/** Brand / type / group menu child guards. */
export function canManageCatalogueItems(flags: RoleFlags): boolean {
  return (
    IsSuperadmin(flags) ||
    IsAdmin(flags) ||
    IsAdminRetail(flags) ||
    IsAdminCatalogue(flags)
  );
}
