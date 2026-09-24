import { describe, expect, it } from "vitest";

import { slugify } from "./slugify";

describe("slugify", () => {
  it("matches the Angular friendly-url helper", () => {
    expect(slugify("Red Shirt")).toBe("red-shirt");
    expect(slugify("Café & Tea")).toBe("cafe-and-tea");
    expect(slugify("--Hello--World--")).toBe("hello-world");
  });
});
