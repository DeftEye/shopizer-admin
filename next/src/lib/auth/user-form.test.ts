import { describe, expect, it } from "vitest";

import { EMPTY_ROLE_FLAGS } from "./roles";
import {
  applyUserGroups,
  canChangeOtherPassword,
  canDeleteUser,
  canEditUser,
  initAdminGroups,
  isStoreFieldEnabled,
  isUserEmailValid,
  passwordsMatch,
  showPasswordFields,
  storeRequiredOnSave,
  validateUserForm,
} from "./user-form";
import type { UserProfile } from "@/lib/api/types";

const admin: UserProfile = {
  id: 2,
  active: true,
  defaultLanguage: "en",
  emailAddress: "admin@shopizer.com",
  firstName: "A",
  lastName: "Dmin",
  groups: [{ name: "ADMIN" }],
  lastAccess: "",
  loginTime: "",
  merchant: "DEFAULT",
  permissions: [],
  userName: "admin@shopizer.com",
};

const superUser: UserProfile = {
  ...admin,
  id: 1,
  groups: [{ name: "SUPERADMIN" }],
};

describe("user form rules", () => {
  it("uses the Angular user-form email pattern", () => {
    expect(isUserEmailValid("admin@shopizer.com")).toBe(true);
    expect(isUserEmailValid("not-an-email")).toBe(false);
  });

  it("requires matching passwords", () => {
    expect(passwordsMatch("Passw0rd", "Passw0rd")).toBe(true);
    expect(passwordsMatch("Passw0rd", "other")).toBe(false);
  });

  it("does not let retail-admin change another user's password", () => {
    expect(canChangeOtherPassword({ ...EMPTY_ROLE_FLAGS, isAdminRetail: true })).toBe(
      false,
    );
    expect(canChangeOtherPassword({ ...EMPTY_ROLE_FLAGS, isAdmin: true })).toBe(true);
    expect(
      showPasswordFields(admin, { ...EMPTY_ROLE_FLAGS, isAdminRetail: true }, false),
    ).toBe(false);
  });

  it("locks store on self-edit and only enables it for superadmin on edit", () => {
    const adminFlags = { ...EMPTY_ROLE_FLAGS, isAdmin: true };
    expect(isStoreFieldEnabled(adminFlags, "create", false)).toBe(true);
    expect(isStoreFieldEnabled(adminFlags, "edit", false)).toBe(false);
    expect(
      isStoreFieldEnabled({ ...EMPTY_ROLE_FLAGS, isSuperadmin: true }, "edit", false),
    ).toBe(true);
    expect(
      isStoreFieldEnabled({ ...EMPTY_ROLE_FLAGS, isSuperadmin: true }, "edit", true),
    ).toBe(false);
  });

  it("cannot delete self or SUPERADMIN", () => {
    expect(canDeleteUser(admin, "2")).toBe(false);
    expect(canDeleteUser(superUser, "9")).toBe(false);
    expect(canDeleteUser(admin, "9")).toBe(true);
    expect(canEditUser(superUser, EMPTY_ROLE_FLAGS)).toBe(false);
    expect(canEditUser(superUser, { ...EMPTY_ROLE_FLAGS, isSuperadmin: true })).toBe(
      true,
    );
  });

  it("disables SUPERADMIN and ADMIN unless the actor is superadmin", () => {
    const groups = initAdminGroups(
      [
        { id: 1, name: "SUPERADMIN", type: "ADMIN" },
        { id: 2, name: "ADMIN", type: "ADMIN" },
        { id: 3, name: "ADMIN_STORE", type: "ADMIN" },
        { id: 4, name: "CUSTOMER", type: "CUSTOMER" },
      ],
      { ...EMPTY_ROLE_FLAGS, isAdmin: true },
    );
    expect(groups.map((group) => group.name)).toEqual([
      "SUPERADMIN",
      "ADMIN",
      "ADMIN_STORE",
    ]);
    expect(groups.find((group) => group.name === "SUPERADMIN")?.disabled).toBe(true);
    expect(groups.find((group) => group.name === "ADMIN")?.disabled).toBe(true);
  });

  it("self cannot edit its own groups", () => {
    const seeded = initAdminGroups(
      [{ id: 2, name: "ADMIN", type: "ADMIN" }],
      { ...EMPTY_ROLE_FLAGS, isSuperadmin: true },
    );
    const next = applyUserGroups(
      seeded,
      admin,
      { ...EMPTY_ROLE_FLAGS, isSuperadmin: true },
      true,
    );
    expect(next[0].checked).toBe(true);
    expect(next[0].disabled).toBe(true);
  });

  it("requires a group and a valid password on create", () => {
    const errors = validateUserForm({
      firstName: "Pat",
      lastName: "Lee",
      emailAddress: "pat@shopizer.com",
      password: "short",
      repeatPassword: "short",
      defaultLanguage: "en",
      groups: [],
      requirePassword: true,
      showPassword: true,
    });
    expect(errors.password).toBe("invalid");
    expect(errors.groups).toBe("required");
  });

  it("rejects an edit password when the repeat field is empty or different", () => {
    const base = {
      firstName: "Pat",
      lastName: "Lee",
      emailAddress: "pat@shopizer.com",
      defaultLanguage: "en",
      groups: [{ id: 2, name: "ADMIN", checked: true, disabled: false }],
      requirePassword: false,
      showPassword: true,
    };
    expect(
      validateUserForm({ ...base, password: "Passw0rd", repeatPassword: "" })
        .repeatPassword,
    ).toBe("notSame");
    expect(
      validateUserForm({ ...base, password: "Passw0rd", repeatPassword: "Other1" })
        .repeatPassword,
    ).toBe("notSame");
    expect(
      validateUserForm({ ...base, password: "Passw0rd", repeatPassword: "Passw0rd" })
        .repeatPassword,
    ).toBeUndefined();
    expect(
      validateUserForm({ ...base, password: "", repeatPassword: "" }).repeatPassword,
    ).toBeUndefined();
  });

  it("only superadmin is prompted for an empty store (Angular isRetailerAdmin is unset)", () => {
    expect(storeRequiredOnSave({ ...EMPTY_ROLE_FLAGS, isSuperadmin: true }, "")).toBe(
      true,
    );
    expect(storeRequiredOnSave({ ...EMPTY_ROLE_FLAGS, isAdminRetail: true }, "")).toBe(
      false,
    );
  });
});
