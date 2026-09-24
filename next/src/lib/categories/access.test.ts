import { describe, expect, it } from "vitest";

import { MENU_ITEMS, menuHasLink } from "@/lib/auth/menu";
import { EMPTY_ROLE_FLAGS } from "@/lib/auth/roles";

import {
  canAccessCatalogue,
  canAccessCategories,
  canEnterCategoryRoutes,
  shouldRedirectCategories,
} from "./access";

describe("catalogue category access", () => {
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

  it("matches MarketplaceGuard", () => {
    expect(
      canAccessCategories({ ...EMPTY_ROLE_FLAGS, isSuperadmin: true }, "MARKETPLACE"),
    ).toBe(true);
    expect(
      canAccessCategories({ ...EMPTY_ROLE_FLAGS, isAdminRetail: true }, "MARKETPLACE"),
    ).toBe(false);
    expect(
      canAccessCategories({ ...EMPTY_ROLE_FLAGS, isAdmin: true }, "STANDARD"),
    ).toBe(true);
    expect(
      canAccessCategories({ ...EMPTY_ROLE_FLAGS, isAdminRetail: true }, "BTB"),
    ).toBe(true);
    expect(
      canAccessCategories({ ...EMPTY_ROLE_FLAGS, isAdminStore: true }, "STANDARD"),
    ).toBe(false);
  });

  it("requires both catalogue and marketplace guards for category routes", () => {
    expect(
      canEnterCategoryRoutes({ ...EMPTY_ROLE_FLAGS, isAdmin: true }, "STANDARD"),
    ).toBe(false);
    expect(
      canEnterCategoryRoutes(
        { ...EMPTY_ROLE_FLAGS, isAdminStore: true },
        "STANDARD",
      ),
    ).toBe(false);
    expect(
      canEnterCategoryRoutes(
        { ...EMPTY_ROLE_FLAGS, isAdminRetail: true },
        "STANDARD",
      ),
    ).toBe(true);
    expect(
      shouldRedirectCategories(
        "/pages/catalogue/categories/categories-list",
        { ...EMPTY_ROLE_FLAGS, isAdminCatalogue: true },
        "STANDARD",
      ),
    ).toBe(true);
  });

  it("keeps Angular category menu links", () => {
    expect(
      menuHasLink(MENU_ITEMS, "/pages/catalogue/categories/categories-list"),
    ).toBe(true);
    expect(
      menuHasLink(MENU_ITEMS, "/pages/catalogue/categories/create-category"),
    ).toBe(true);
    expect(
      menuHasLink(
        MENU_ITEMS,
        "/pages/catalogue/categories/categories-hierarchy",
      ),
    ).toBe(true);
  });
});
