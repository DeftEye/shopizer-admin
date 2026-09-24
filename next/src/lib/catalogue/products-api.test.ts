import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  checkProductSku,
  createProduct,
  deleteProduct,
  getManufacturers,
  getProductById,
  getProductTypes,
  getProductsByCategory,
  getProductsByOrder,
  getStoreLanguages,
  listCategories,
  listProducts,
  listStores,
  updateProduct,
  updateProductFromTable,
} from "./products-api";

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

describe("products api", () => {
  beforeEach(() => {
    process.env.SHOPIZER_API_URL = API_URL;
    localStorage.clear();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
    localStorage.clear();
  });

  it("lists products on /v2/products with admin list params", async () => {
    const fetchMock = mockFetch({ products: [], recordsTotal: 0 });

    await listProducts({
      store: "DEFAULT",
      lang: "en",
      count: 20,
      page: 0,
      sku: "HAT",
    });

    const url = String(fetchMock.mock.calls[0][0]);
    expect(url.startsWith(`${API_URL}/v2/products?`)).toBe(true);
    const params = new URL(url).searchParams;
    expect(params.get("store")).toBe("DEFAULT");
    expect(params.get("lang")).toBe("en");
    expect(params.get("count")).toBe("20");
    expect(params.get("page")).toBe("0");
    expect(params.get("origin")).toBe("admin");
    expect(params.get("sku")).toBe("HAT");
  });

  it("loads and writes definition through the Angular v1/v2 split", async () => {
    const fetchMock = mockFetch({});

    await getProductById(9);
    await createProduct({ sku: "A" }, "DEFAULT");
    await updateProduct(9, { sku: "A" }, "DEFAULT");
    await deleteProduct(9);
    await updateProductFromTable(9, {
      available: true,
      price: "1",
      quantity: 2,
    });
    await checkProductSku("A");
    await getProductTypes();
    await getManufacturers();
    await getStoreLanguages("DEFAULT");
    await listStores();

    const urls = fetchMock.mock.calls.map((call) => String(call[0]));
    const methods = fetchMock.mock.calls.map(
      (call) => (call[1] as RequestInit).method,
    );

    expect(urls[0]).toBe(`${API_URL}/v1/product/9?lang=_all`);
    expect(urls[1]).toBe(
      `${API_URL}/v2/private/product/definition?store=DEFAULT`,
    );
    expect(methods[1]).toBe("POST");
    expect(urls[2]).toBe(`${API_URL}/v2/private/product/9?store=DEFAULT`);
    expect(methods[2]).toBe("PUT");
    expect(urls[3]).toBe(`${API_URL}/v1/private/product/9`);
    expect(methods[3]).toBe("DELETE");
    expect(urls[4]).toBe(`${API_URL}/v1/private/product/9`);
    expect(methods[4]).toBe("PATCH");
    expect(urls[5]).toBe(`${API_URL}/v1/private/product/unique?code=A`);
    expect(urls[6]).toBe(`${API_URL}/v1/private/product/types`);
    expect(urls[7]).toBe(`${API_URL}/v1/manufacturers/`);
    expect(urls[8]).toBe(`${API_URL}/v1/store/languages?store=DEFAULT`);
    expect(urls[9]).toBe(`${API_URL}/v1/private/stores?code=DEFAULT`);
  });

  it("loads ordering from the hardcoded Angular /v1/product query", async () => {
    const fetchMock = mockFetch({ products: [] });

    await getProductsByOrder();
    await getProductsByCategory(4);
    await listCategories("fr");

    const urls = fetchMock.mock.calls.map((call) => String(call[0]));
    expect(urls[0]).toBe(`${API_URL}/v1/product?count=200&lang=en&page=0`);
    expect(urls[1]).toBe(
      `${API_URL}/v1/product?category=4&count=200&lang=en&page=0`,
    );
    expect(urls[2]).toBe(`${API_URL}/v1/category?count=50&page=0&lang=fr`);
  });
});
