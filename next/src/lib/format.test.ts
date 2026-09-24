import { describe, expect, it } from "vitest";

import { slugify } from "./format";
import { nextPage, pageNumbers } from "./page";

describe("slugify", () => {
  it("matches Angular slugifying for brand names", () => {
    expect(slugify("Air Max")).toBe("air-max");
    expect(slugify("Café & Tea")).toBe("cafe-and-tea");
  });
});

describe("paginator", () => {
  it("ports Angular page actions", () => {
    expect(nextPage("onNext", 2)).toBe(3);
    expect(nextPage("onPrev", 2)).toBe(1);
    expect(nextPage("onFirst", 4)).toBe(1);
    expect(nextPage("onLast", 4, 9)).toBe(9);
    expect(nextPage("onPage", 1, 3)).toBe(3);
  });

  it("builds a compact page window", () => {
    expect(pageNumbers(1, 100, 25, 5)).toEqual([1, 2, 3, 4]);
  });
});
