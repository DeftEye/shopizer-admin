import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { rolesFromGroups, validateLogin } from "./roles.ts";

describe("validateLogin", () => {
  it("requires an email username and a password", () => {
    assert.equal(validateLogin("", "x"), "Username is required");
    assert.equal(validateLogin("admin", "x"), "Username format must be an email");
    assert.equal(validateLogin("admin@shopizer.com", ""), "Password is required");
    assert.equal(validateLogin("admin@shopizer.com", "password"), null);
  });
});

describe("rolesFromGroups", () => {
  it("maps SUPERADMIN the same way Angular UserService.checkForAccess does", () => {
    const roles = rolesFromGroups([{ name: "SUPERADMIN" }]);
    assert.equal(roles.isSuperadmin, true);
    assert.equal(roles.canAccessToOrder, true);
    assert.equal(roles.isAdmin, false);
  });

  it("maps ADMIN_RETAIL without granting superadmin", () => {
    const roles = rolesFromGroups([{ name: "ADMIN_RETAIL" }]);
    assert.equal(roles.isAdminRetail, true);
    assert.equal(roles.isSuperadmin, false);
    assert.equal(roles.canAccessToOrder, false);
  });
});
