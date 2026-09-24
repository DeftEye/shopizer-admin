import { describe, expect, it } from "vitest";

import { moveItemInArray, pageFromEvent, visiblePages } from "./pagination";

describe("product list pagination", () => {
  it("maps Angular paginator actions", () => {
    expect(pageFromEvent(3, { action: "onPage", data: 5 })).toBe(5);
    expect(pageFromEvent(3, { action: "onPrev" })).toBe(2);
    expect(pageFromEvent(3, { action: "onNext" })).toBe(4);
    expect(pageFromEvent(3, { action: "onFirst" })).toBe(1);
    expect(pageFromEvent(3, { action: "onLast", data: 9 })).toBe(9);
  });

  it("shows a 5-page window around the current page", () => {
    expect(visiblePages(1, 100, 20, 5)).toEqual([1, 2, 3, 4, 5]);
    expect(visiblePages(4, 100, 20, 5)).toEqual([1, 2, 3, 4, 5]);
  });

  it("reorders locally like CDK drag-drop", () => {
    expect(moveItemInArray(["a", "b", "c"], 0, 2)).toEqual(["b", "c", "a"]);
  });
});
