import { describe, expect, it } from "vitest";

import { ALPHANUMERIC } from "@/lib/constants";

import {
  isAlphanumeric,
  joinNames,
  nameFromDescriptions,
  pageRange,
  visiblePages,
} from "./options-helpers";

describe("options helpers", () => {
  it("reads the name for the active language", () => {
    expect(
      nameFromDescriptions(
        [
          { language: "fr", name: "Taille" },
          { language: "en", name: "Size" },
        ],
        "en",
      ),
    ).toBe("Size");
    expect(nameFromDescriptions([], "en")).toBe("");
  });

  it("joins option-set value names the way Angular does", () => {
    expect(joinNames([{ name: "S" }, { name: "M" }])).toBe("S, M");
    expect(joinNames(null)).toBe("");
  });

  it("uses the Angular alphanumeric pattern", () => {
    expect(ALPHANUMERIC.test("Size01")).toBe(true);
    expect(isAlphanumeric("Size-01")).toBe(false);
    expect(isAlphanumeric("")).toBe(false);
  });

  it("builds paginator pages like Angular", () => {
    expect(visiblePages(1, 40, 15, 5)).toEqual([1, 2, 3]);
    expect(visiblePages(3, 80, 15, 5)).toEqual([1, 2, 3, 4, 5]);
    expect(pageRange(1, 15, 40)).toEqual({ min: 1, max: 15 });
    expect(pageRange(3, 15, 40)).toEqual({ min: 31, max: 40 });
  });
});
