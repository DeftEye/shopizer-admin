import { describe, expect, it } from "vitest";

import { MENU_ITEMS, menuHasLink } from "@/lib/auth/menu";
import { EMPTY_ROLE_FLAGS } from "@/lib/auth/roles";

import { canAccessCatalogue } from "./access";

describe("catalogue access", () => {
  it("matches SuperadminStoreRetailCatalogueGuard", () => {
    expect(canAccessCatalogue(EMPTY_ROLE_FLAGS)).toBe(false);
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
    expect(canAccessCatalogue({ ...EMPTY_ROLE_FLAGS, isAdmin: true })).toBe(
      false,
    );
  });

  it("keeps Angular options menu links", () => {
    expect(menuHasLink(MENU_ITEMS, "/pages/catalogue/options/options-list")).toBe(
      true,
    );
    expect(
      menuHasLink(MENU_ITEMS, "/pages/catalogue/options/options-values-list"),
    ).toBe(true);
    expect(
      menuHasLink(MENU_ITEMS, "/pages/catalogue/options/options-set-list"),
    ).toBe(true);
    expect(
      menuHasLink(MENU_ITEMS, "/pages/catalogue/options/variations/list"),
    ).toBe(true);
  });
});
