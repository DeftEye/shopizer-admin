import { describe, expect, it } from "vitest";

import {
  buildProductPayload,
  collectDescriptionDefaults,
  emptyDescription,
  emptyProductForm,
  fillEmptyDescriptions,
  formatDateAvailable,
  formFromProduct,
  invalidProductControls,
  productListName,
} from "./product-payload";

function validForm() {
  const form = emptyProductForm("en");
  form.sku = "SKU1";
  form.manufacturer = "testbrand";
  form.price = "9.99";
  form.quantity = "3";
  form.sortOrder = "0";
  form.descriptions = [
    { ...emptyDescription("en"), name: "Hat", friendlyUrl: "hat" },
    { ...emptyDescription("fr"), name: "", friendlyUrl: "" },
  ];
  return form;
}

describe("product payload", () => {
  it("formats dateAvailable as yyyy-MM-DD", () => {
    expect(formatDateAvailable("2024-03-09")).toBe("2024-03-09");
    expect(formatDateAvailable(new Date(2024, 2, 9))).toBe("2024-03-09");
  });

  it("flags the same required controls as the Angular form", () => {
    expect(invalidProductControls(emptyProductForm("en"))).toEqual([
      "sku",
      "manufacturer",
      "price",
      "quantity",
      "sortOrder",
    ]);
  });

  it("rejects non-alphanumeric sku and non-numeric quantity/order", () => {
    const form = emptyProductForm("en");
    form.sku = "bad sku";
    form.manufacturer = "acme";
    form.price = "1";
    form.quantity = "1.5";
    form.sortOrder = "x";
    form.descriptions = [
      { ...emptyDescription("en"), name: "A", friendlyUrl: "a" },
    ];
    expect(invalidProductControls(form)).toEqual([
      "sku",
      "quantity",
      "sortOrder",
    ]);
  });

  it("copies the first filled name/url/title into empty descriptions", () => {
    const descriptions = [
      { ...emptyDescription("en"), name: "Hat", friendlyUrl: "hat", title: "" },
      { ...emptyDescription("fr"), name: "", friendlyUrl: "" },
    ];
    const defaults = collectDescriptionDefaults(descriptions, "DEFAULT");
    expect(defaults.name).toBe("Hat");
    expect(defaults.friendlyUrl).toBe("hat");
    expect(defaults.title).toBe("DEFAULT | Hat");

    const filled = fillEmptyDescriptions(descriptions, defaults);
    expect(filled[1].name).toBe("Hat");
    expect(filled[1].friendlyUrl).toBe("hat");
    expect(filled[1].title).toBe("DEFAULT | Hat");
  });

  it("omits selectedLanguage from the saved body", () => {
    const { payload, missing, requiredMissing } = buildProductPayload(
      validForm(),
      "DEFAULT",
    );
    expect(missing).toContain("descriptions");
    expect(requiredMissing).toBe(false);
    expect(payload).not.toHaveProperty("selectedLanguage");
    expect(payload.dateAvailable).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(payload.canBePurchased).toBe(true);
    expect(payload.display).toBe(true);
  });

  it("binds a v1 product detail onto the definition form", () => {
    const form = formFromProduct(
      {
        sku: "SKU1",
        visible: true,
        canBePurchased: false,
        dateAvailable: "2024-01-02",
        manufacturer: { code: "nike" },
        type: { code: "GENERAL" },
        price: 12,
        quantity: 4,
        sortOrder: 1,
        productSpecifications: { weight: "1", height: "2", width: "3", length: "4" },
        descriptions: [
          {
            language: "en",
            name: "Shoe",
            friendlyUrl: "shoe",
            highlights: "hi",
            description: "<p>d</p>",
            title: "T",
            keyWords: "k",
            metaDescription: "m",
          },
        ],
      },
      [{ code: "en" }, { code: "fr" }],
      "en",
    );

    expect(form.sku).toBe("SKU1");
    expect(form.manufacturer).toBe("nike");
    expect(form.type).toBe("GENERAL");
    expect(form.canBePurchased).toBe(false);
    expect(form.descriptions[0].name).toBe("Shoe");
    expect(form.descriptions[1].language).toBe("fr");
    expect(form.descriptions[1].name).toBe("");
  });

  it("reads list names from description.name like the Angular table", () => {
    expect(productListName({ description: { name: "Bag" }, name: "x" })).toBe(
      "Bag",
    );
    expect(productListName({ name: "Loose" })).toBe("Loose");
  });
});
