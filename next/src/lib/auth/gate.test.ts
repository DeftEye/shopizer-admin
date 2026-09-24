import { describe, expect, it } from "vitest";

import { EMPTY_ROLE_FLAGS } from "./roles";
import {
  canAccessUserAdmin,
  isUserAdminPath,
  shouldRedirectToAuth,
  shouldRedirectUserAdmin,
} from "./gate";

describe("auth gate", () => {
  it("sends /pages to /auth when there is no token", () => {
    expect(shouldRedirectToAuth("/pages/home", undefined)).toBe(true);
    expect(shouldRedirectToAuth("/pages", null)).toBe(true);
    expect(shouldRedirectToAuth("/pages/home", "jwt")).toBe(false);
    expect(shouldRedirectToAuth("/auth", undefined)).toBe(false);
  });

  it("treats create-user, users, and user/:id as admin paths", () => {
    expect(isUserAdminPath("/pages/user-management/create-user")).toBe(true);
    expect(isUserAdminPath("/pages/user-management/users")).toBe(true);
    expect(isUserAdminPath("/pages/user-management/user/9")).toBe(true);
    expect(isUserAdminPath("/pages/user-management/profile")).toBe(false);
    expect(isUserAdminPath("/pages/user-management/change-password")).toBe(false);
  });

  it("mirrors SuperuserAdminGuard — SUPERADMIN | ADMIN | ADMIN_RETAIL", () => {
    expect(canAccessUserAdmin({ ...EMPTY_ROLE_FLAGS, isSuperadmin: true })).toBe(
      true,
    );
    expect(canAccessUserAdmin({ ...EMPTY_ROLE_FLAGS, isAdmin: true })).toBe(true);
    expect(canAccessUserAdmin({ ...EMPTY_ROLE_FLAGS, isAdminRetail: true })).toBe(
      true,
    );
    expect(canAccessUserAdmin(EMPTY_ROLE_FLAGS)).toBe(false);
    expect(
      shouldRedirectUserAdmin("/pages/user-management/users", EMPTY_ROLE_FLAGS),
    ).toBe(true);
    expect(
      shouldRedirectUserAdmin("/pages/user-management/profile", EMPTY_ROLE_FLAGS),
    ).toBe(false);
  });
});
