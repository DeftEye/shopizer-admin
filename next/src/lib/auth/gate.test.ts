import { describe, expect, it } from "vitest";

import { shouldRedirectToAuth } from "./gate";

describe("auth gate", () => {
  it("sends /pages to /auth when there is no token", () => {
    expect(shouldRedirectToAuth("/pages/home", undefined)).toBe(true);
    expect(shouldRedirectToAuth("/pages", null)).toBe(true);
    expect(shouldRedirectToAuth("/pages/home", "jwt")).toBe(false);
    expect(shouldRedirectToAuth("/auth", undefined)).toBe(false);
  });
});
