import { describe, expect, it } from "vitest";

import { formatIsoDate } from "./validation";

describe("formatIsoDate", () => {
  it("keeps YYYY-MM-DD as a calendar date without UTC shift", () => {
    expect(formatIsoDate("2026-01-15")).toBe("2026-01-15");
    expect(formatIsoDate("2026-01-15T00:00:00.000Z")).toBe("2026-01-15");
  });

  it("formats a Date with local calendar fields", () => {
    const local = new Date(2026, 0, 15, 23, 0, 0);
    expect(formatIsoDate(local)).toBe("2026-01-15");
  });
});
