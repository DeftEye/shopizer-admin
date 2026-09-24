import { describe, expect, it } from "vitest";

import { EMPTY_ROLE_FLAGS } from "./roles";
import { canAccessCatalogue } from "./catalogue-guard";

describe("catalogue guard", () => {
  it("matches SuperadminStoreRetailCatalogueGuard flags", () => {
    expect(canAccessCatalogue(EMPTY_ROLE_FLAGS)).toBe(false);
    expect(canAccessCatalogue({ ...EMPTY_ROLE_FLAGS, isAdmin: true })).toBe(
      false,
    );
    expect(
      canAccessCatalogue({ ...EMPTY_ROLE_FLAGS, isSuperadmin: true }),
    ).toBe(true);
    expect(
      canAccessCatalogue({ ...EMPTY_ROLE_FLAGS, isAdminCatalogue: true }),
    ).toBe(true);
    expect(
      canAccessCatalogue({ ...EMPTY_ROLE_FLAGS, isAdminRetail: true }),
    ).toBe(true);
    expect(
      canAccessCatalogue({ ...EMPTY_ROLE_FLAGS, isAdminStore: true }),
    ).toBe(true);
  });
});
