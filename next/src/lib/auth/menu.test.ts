import { describe, expect, it } from "vitest";

import { EMPTY_ROLE_FLAGS, checkForAccess } from "./roles";
import { buildVisibleMenu, menuHasLink } from "./menu";

describe("visible menu", () => {
  it("hides User list, Store create, and Catalogue without admin flags", () => {
    const menu = buildVisibleMenu(EMPTY_ROLE_FLAGS, "STANDARD");

    expect(menuHasLink(menu, "/pages/user-management/users")).toBe(false);
    expect(menuHasLink(menu, "/pages/store-management/create-store")).toBe(
      false,
    );
    expect(menu.some((item) => item.key === "COMPONENTS.CATALOUGE_MANAGEMENT")).toBe(
      false,
    );
    expect(menuHasLink(menu, "/pages/home")).toBe(true);
    expect(menuHasLink(menu, "/pages/user-management/profile")).toBe(true);
  });

  it("shows brands, types, and groups for ADMIN", () => {
    const menu = buildVisibleMenu(checkForAccess([{ name: "ADMIN" }]), "STANDARD");

    expect(menuHasLink(menu, "/pages/catalogue/brands/brands-list")).toBe(true);
    expect(menuHasLink(menu, "/pages/catalogue/brands/create-brand")).toBe(true);
    expect(menuHasLink(menu, "/pages/catalogue/types/types-list")).toBe(true);
    expect(menuHasLink(menu, "/pages/catalogue/products-groups/groups-list")).toBe(
      true,
    );
  });
});
