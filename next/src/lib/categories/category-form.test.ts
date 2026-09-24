import { describe, expect, it } from "vitest";

import {
  buildCategoryPayload,
  canMoveCategory,
  decorateHierarchy,
  flattenCategoryTree,
  formFromCategory,
  invalidCategoryControls,
  moveCategoryNode,
  parentOptions,
} from "./category-form";
import type { CategoryFormState, CategoryNode } from "./types";

const tree: CategoryNode[] = [
  {
    id: 1,
    code: "rootcat",
    description: { name: "Root cat" },
    children: [
      {
        id: 2,
        code: "child",
        description: { name: "Child" },
        parent: { id: 1, code: "rootcat" },
        children: [],
      },
    ],
  },
];

function form(partial: Partial<CategoryFormState> = {}): CategoryFormState {
  return {
    parent: "root",
    store: "DEFAULT",
    visible: true,
    code: "hats",
    sortOrder: "0",
    selectedLanguage: "en",
    descriptions: [
      {
        language: "en",
        name: "Hats",
        highlights: "",
        friendlyUrl: "hats",
        description: "",
        title: "",
        metaDescription: "",
      },
    ],
    ...partial,
  };
}

describe("category form helpers", () => {
  it("flattens children the way the Angular list does", () => {
    const rows = flattenCategoryTree(tree);
    expect(rows.map((row) => row.code)).toEqual(["rootcat", "child"]);
    expect(rows[0].name).toBe("Root cat");
  });

  it("excludes the current category and its descendants from the parent picker", () => {
    expect(parentOptions(tree, 1).map((item) => item.code)).toEqual(["root"]);
    expect(parentOptions(tree, 2).map((item) => item.code)).toEqual([
      "root",
      "rootcat",
    ]);
  });

  it("fills empty language fields from the first complete description", () => {
    const { payload, requiredMissing } = buildCategoryPayload(
      form({
        descriptions: [
          {
            language: "en",
            name: "Hats",
            highlights: "warm",
            friendlyUrl: "hats",
            description: "<p>Hi</p>",
            title: "Hats title",
            metaDescription: "",
          },
          {
            language: "fr",
            name: "",
            highlights: "",
            friendlyUrl: "",
            description: "",
            title: "",
            metaDescription: "",
          },
        ],
      }),
      [{ id: 0, code: "root" }],
      "DEFAULT",
      false,
    );

    expect(requiredMissing).toBe(false);
    expect(payload.parent).toEqual({ id: 0, code: "root" });
    expect(payload.store).toBe("DEFAULT");
    expect(payload.descriptions[1].name).toBe("Hats");
    expect(payload.descriptions[1].friendlyUrl).toBe("hats");
    expect(payload.descriptions[1].highlights).toBe("warm");
    expect(payload.selectedLanguage).toBe("en");
  });

  it("keeps store locked to the merchant unless the user is SUPERADMIN", () => {
    const { payload } = buildCategoryPayload(
      form({ store: "USA" }),
      [{ id: 0, code: "root" }],
      "DEFAULT",
      false,
    );
    expect(payload.store).toBe("DEFAULT");

    const admin = buildCategoryPayload(
      form({ store: "USA" }),
      [{ id: 0, code: "root" }],
      "DEFAULT",
      true,
    );
    expect(admin.payload.store).toBe("USA");
  });

  it("flags invalid code and empty descriptions", () => {
    expect(
      invalidCategoryControls(form({ code: "not valid" })),
    ).toContain("code");
    expect(
      invalidCategoryControls(
        form({
          descriptions: [
            {
              language: "en",
              name: "",
              highlights: "",
              friendlyUrl: "",
              description: "",
              title: "",
              metaDescription: "",
            },
          ],
        }),
      ),
    ).toContain("descriptions");
  });

  it("hydrates the edit form from lang=_all descriptions", () => {
    const next = formFromCategory(
      {
        id: 9,
        code: "hats",
        store: "USA",
        visible: true,
        sortOrder: 3,
        parent: { id: 1, code: "rootcat" },
        descriptions: [
          {
            language: "en",
            name: "Hats",
            friendlyUrl: "hats",
            title: "T",
          },
        ],
      },
      [{ code: "en" }, { code: "fr" }],
      "en",
      "DEFAULT",
    );
    expect(next.parent).toBe("rootcat");
    expect(next.store).toBe("USA");
    expect(next.sortOrder).toBe("3");
    expect(next.descriptions[0].name).toBe("Hats");
    expect(next.descriptions[1].language).toBe("fr");
    expect(next.descriptions[1].name).toBe("");
  });

  it("moves a node under another parent and refuses a descendant cycle", () => {
    const decorated = decorateHierarchy(tree);
    const moved = moveCategoryNode(decorated, 2, -1);
    expect(moved.map((node) => node.id)).toEqual([1, 2]);
    expect(canMoveCategory(decorated, 1, 2)).toBe(false);
    expect(moveCategoryNode(decorated, 1, 2)).toEqual(decorated);
  });
});
