import { describe, expect, it } from "vitest";

import { EMPTY_ROLE_FLAGS, canManageCatalogueItems, checkForAccess } from "./roles";

describe("checkForAccess", () => {
  it("maps SUPERADMIN the way Angular does", () => {
    expect(checkForAccess([{ name: "SUPERADMIN" }])).toEqual({
      ...EMPTY_ROLE_FLAGS,
      canAccessToOrder: true,
      isSuperadmin: true,
    });
  });

  it("maps ADMIN_ORDER to isAdminOrder only (canAccessToOrder needs access-roles names)", () => {
    expect(checkForAccess([{ name: "ADMIN_ORDER" }])).toEqual({
      ...EMPTY_ROLE_FLAGS,
      isAdminOrder: true,
    });
  });
});

describe("canManageCatalogueItems", () => {
  it("allows ADMIN and ADMIN_CATALOGUE, not a bare customer", () => {
    expect(canManageCatalogueItems(checkForAccess([{ name: "ADMIN" }]))).toBe(
      true,
    );
    expect(
      canManageCatalogueItems(checkForAccess([{ name: "ADMIN_CATALOGUE" }])),
    ).toBe(true);
    expect(
      canManageCatalogueItems(checkForAccess([{ name: "CUSTOMER" }])),
    ).toBe(false);
  });
});
