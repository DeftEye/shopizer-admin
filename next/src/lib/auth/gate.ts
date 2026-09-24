import type { RoleFlags } from "@/lib/api/types";

import { isAnAdmin } from "./roles";

/** Angular `AuthGuard`: `/pages` requires a token. */
export function shouldRedirectToAuth(
  pathname: string,
  token: string | undefined | null,
): boolean {
  const onPages = pathname === "/pages" || pathname.startsWith("/pages/");
  return onPages && !token;
}

/**
 * `SuperuserAdminGuard` and `SuperuserAdminRetailGuard` — same role set
 * (SUPERADMIN | ADMIN | ADMIN_RETAIL). Failed checks go to home.
 */
export function canAccessUserAdmin(flags: RoleFlags): boolean {
  return isAnAdmin(flags);
}

export function isUserAdminPath(pathname: string): boolean {
  return (
    pathname === "/pages/user-management/create-user" ||
    pathname === "/pages/user-management/users" ||
    pathname.startsWith("/pages/user-management/users/") ||
    pathname.startsWith("/pages/user-management/user/")
  );
}

export function shouldRedirectUserAdmin(
  pathname: string,
  flags: RoleFlags,
): boolean {
  return isUserAdminPath(pathname) && !canAccessUserAdmin(flags);
}
