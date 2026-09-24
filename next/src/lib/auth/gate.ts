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

/** Angular `SuperuserAdminRetailStoreGuard`. */
export function canAccessStoreDetails(flags: RoleFlags): boolean {
  return isAnAdmin(flags) || flags.isAdminStore;
}

/** Angular `SuperuserAdminRetailGuard` — create store. */
export function canAccessCreateStore(flags: RoleFlags): boolean {
  return isAnAdmin(flags);
}

/** Angular `SuperuserAdminGuard` — stores list. */
export function canAccessStoresList(flags: RoleFlags): boolean {
  return isAnAdmin(flags);
}
