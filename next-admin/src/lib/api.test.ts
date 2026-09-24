import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { defaultErrorMessage } from "./api.ts";

describe("defaultErrorMessage", () => {
  it("keeps credential copy on login 401 only", () => {
    assert.equal(defaultErrorMessage(401, "login"), "Invalid username or password");
    assert.equal(
      defaultErrorMessage(401, "profile"),
      "Session expired. Please sign in again.",
    );
    assert.equal(defaultErrorMessage(404, "profile"), "Could not load the user profile");
  });

  it("treats timeouts and 5xx as unreachable, not bad credentials", () => {
    assert.equal(defaultErrorMessage(0, "login"), "Cannot reach the Shopizer API");
    assert.equal(defaultErrorMessage(502, "profile"), "Cannot reach the Shopizer API");
  });
});
