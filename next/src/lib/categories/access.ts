import type { RoleFlags } from "@/lib/api/types";
import type { AppMode } from "@/lib/env";
import { isAnAdmin, isSuperAdmin } from "@/lib/auth/roles";

/** Angular `SuperadminStoreRetailCatalogueGuard` on `/pages/catalogue`. */
export function canAccessCatalogue(flags: RoleFlags): boolean {
  return (
    flags.isSuperadmin ||
    flags.isAdminCatalogue ||
    flags.isAdminRetail ||
    flags.isAdminStore
  );
}

/**
 * Angular `MarketplaceGuard` on `/pages/catalogue/categories`.
 * MARKETPLACE → SUPERADMIN only; otherwise `SecurityService.isAnAdmin`.
 */
export function canAccessCategories(flags: RoleFlags, mode: AppMode): boolean {
  if (mode === "MARKETPLACE") {
    return isSuperAdmin(flags);
  }
  return isAnAdmin(flags);
}

/** Parent catalogue guard + MarketplaceGuard (direct URL, not just the menu). */
export function canEnterCategoryRoutes(
  flags: RoleFlags,
  mode: AppMode,
): boolean {
  return canAccessCatalogue(flags) && canAccessCategories(flags, mode);
}

export function isCategoryPath(pathname: string): boolean {
  return (
    pathname === "/pages/catalogue/categories" ||
    pathname.startsWith("/pages/catalogue/categories/")
  );
}

export function shouldRedirectCategories(
  pathname: string,
  flags: RoleFlags,
  mode: AppMode,
): boolean {
  return isCategoryPath(pathname) && !canEnterCategoryRoutes(flags, mode);
}
