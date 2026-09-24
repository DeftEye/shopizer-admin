import { describe, expect, it } from "vitest";

import { visiblePages } from "./pagination";

describe("visiblePages", () => {
  it("matches Angular PaginatorComponent.getPages windowing", () => {
    expect(visiblePages(1, 100, 25, 5)).toEqual([1, 2, 3, 4]);
    expect(visiblePages(3, 100, 25, 5)).toEqual([1, 2, 3, 4]);
  });
});
