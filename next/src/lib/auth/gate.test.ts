import { describe, expect, it } from "vitest";

import { EMPTY_ROLE_FLAGS } from "./roles";
import {
  canAccessCreateStore,
  canAccessStoreDetails,
  canAccessStoresList,
  shouldRedirectToAuth,
} from "./gate";

describe("auth gate", () => {
  it("sends /pages to /auth when there is no token", () => {
    expect(shouldRedirectToAuth("/pages/home", undefined)).toBe(true);
    expect(shouldRedirectToAuth("/pages", null)).toBe(true);
    expect(shouldRedirectToAuth("/pages/home", "jwt")).toBe(false);
    expect(shouldRedirectToAuth("/auth", undefined)).toBe(false);
  });

  it("matches Angular store-management guards", () => {
    const storeOnly = { ...EMPTY_ROLE_FLAGS, isAdminStore: true };
    const admin = { ...EMPTY_ROLE_FLAGS, isAdmin: true };

    expect(canAccessStoreDetails(storeOnly)).toBe(true);
    expect(canAccessCreateStore(storeOnly)).toBe(false);
    expect(canAccessStoresList(storeOnly)).toBe(false);

    expect(canAccessStoreDetails(admin)).toBe(true);
    expect(canAccessCreateStore(admin)).toBe(true);
    expect(canAccessStoresList(admin)).toBe(true);
    expect(canAccessCreateStore(EMPTY_ROLE_FLAGS)).toBe(false);
  });
});
