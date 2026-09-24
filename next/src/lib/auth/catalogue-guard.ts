import type { RoleFlags } from "@/lib/api/types";

/**
 * Angular `SuperadminStoreRetailCatalogueGuard` — catalogue module, including
 * product-child screens. `isAdmin` is not in this set (unlike the menu).
 */
export function canAccessCatalogue(flags: RoleFlags): boolean {
  return (
    flags.isSuperadmin ||
    flags.isAdminCatalogue ||
    flags.isAdminRetail ||
    flags.isAdminStore
  );
}
