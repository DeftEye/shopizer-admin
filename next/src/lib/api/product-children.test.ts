import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { client } from "./client";
import {
  addImageUrl,
  createAttribute,
  createInventory,
  createProductImage,
  deleteAttribute,
  deleteInventory,
  getInventories,
  getInventoryById,
  getListOfOptionValues,
  getListOfOptions,
  getProductAttributes,
  getProductById,
  getProductImages,
  normalizeImages,
  removeProductImage,
  updateInventory,
  updateProductImageOrder,
} from "./product-children";

const API_URL = "http://localhost:8080/api";

function mockFetch(jsonBody: unknown = {}) {
  const fetchMock = vi.fn().mockResolvedValue({
    ok: true,
    status: 200,
    statusText: "OK",
    text: async () => JSON.stringify(jsonBody),
  });
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
}

describe("product-children api", () => {
  beforeEach(() => {
    process.env.SHOPIZER_API_URL = API_URL;
    localStorage.clear();
    localStorage.setItem("token", "jwt");
    localStorage.setItem("merchant", "DEFAULT");
    localStorage.setItem("lang", "en");
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    localStorage.clear();
  });

  it("loads product, images, inventory, and attributes on existing /v1 paths", async () => {
    const fetchMock = mockFetch({});

    await getProductById(12);
    await getProductImages(12);
    await getInventories(12, { count: 10, page: 0, lang: "en" });
    await getInventoryById(12, 4);
    await getProductAttributes(12, { store: "DEFAULT", lang: "_all", count: 20, page: 0 });
    await getListOfOptions({ count: 1000 });
    await getListOfOptionValues({});

    expect(fetchMock.mock.calls.map((call) => call[0])).toEqual([
      `${API_URL}/v1/product/12?lang=_all`,
      `${API_URL}/v1/product/12/images`,
      `${API_URL}/v1/private/product/12/inventory?count=10&page=0&lang=en`,
      `${API_URL}/v1/private/product/12/inventory/4?lang=_all`,
      `${API_URL}/v1/private/product/12/attributes?store=DEFAULT&lang=_all&count=20&page=0`,
      `${API_URL}/v1/private/product/options?count=1000`,
      `${API_URL}/v1/private/product/options/values`,
    ]);
  });

  it("posts image FormData and patches order like Angular", async () => {
    const fetchMock = mockFetch({});
    const form = new FormData();
    form.append("file", new Blob(["x"]), "a.png");

    await createProductImage(9, form);
    await updateProductImageOrder(9, { id: 3, position: 2 });
    await removeProductImage(9, 3);

    expect(fetchMock.mock.calls[0][0]).toBe(
      `${API_URL}/v1/private/product/9/images`,
    );
    expect((fetchMock.mock.calls[0][1] as RequestInit).method).toBe("POST");
    expect((fetchMock.mock.calls[0][1] as RequestInit).body).toBe(form);
    expect(fetchMock.mock.calls[1][0]).toBe(
      `${API_URL}/v1/private/product/9/image/3?order=2`,
    );
    expect((fetchMock.mock.calls[1][1] as RequestInit).method).toBe("PATCH");
    expect((fetchMock.mock.calls[1][1] as RequestInit).body).toBe("[]");
    expect(fetchMock.mock.calls[2][0]).toBe(
      `${API_URL}/v1/private/product/9/image/3`,
    );
    expect((fetchMock.mock.calls[2][1] as RequestInit).method).toBe("DELETE");
  });

  it("creates and updates inventory and attributes on Angular verbs", async () => {
    const fetchMock = mockFetch({ id: 1 });

    await createInventory({ productId: "8", sku: "SKU1" });
    await updateInventory("8", "2", { id: 2 });
    await deleteInventory(2);
    await createAttribute("8", { option: { code: "color" } });
    await deleteAttribute("8", 15);

    expect(fetchMock.mock.calls.map((call) => [
      (call[1] as RequestInit).method,
      call[0],
    ])).toEqual([
      ["POST", `${API_URL}/v1/private/product/inventory`],
      ["PUT", `${API_URL}/v1/private/product/8/inventory/2`],
      ["DELETE", `${API_URL}/v1/private/product/inventory/2`],
      ["POST", `${API_URL}/v1/private/product/8/attribute`],
      ["DELETE", `${API_URL}/v1/private/product/8/attribute/15`],
    ]);
  });

  it("addImageUrl uses the Shopizer request base", () => {
    expect(addImageUrl(5)).toBe(`${client.getBaseUrl()}/v1/private/product/5/images`);
  });

  it("normalizeImages accepts an array or { images }", () => {
    expect(normalizeImages([{ id: 1 }])).toEqual([{ id: 1 }]);
    expect(normalizeImages({ images: [{ id: 2 }] })).toEqual([{ id: 2 }]);
    expect(normalizeImages({})).toEqual([]);
  });
});
