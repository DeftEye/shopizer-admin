import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  addCategory,
  checkCategoryCode,
  deleteCategory,
  getCategoryById,
  getStoreLanguages,
  listCategories,
  listStoreNames,
  updateCategory,
  updateCategoryVisibility,
  updateHierarchy,
} from "./categories";

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

describe("categories api", () => {
  beforeEach(() => {
    process.env.SHOPIZER_API_URL = API_URL;
    localStorage.clear();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
    localStorage.clear();
  });

  it("lists categories on /v1/category with Angular list params", async () => {
    const fetchMock = mockFetch({ categories: [], recordsTotal: 0 });

    await listCategories({
      store: "DEFAULT",
      lang: "en",
      count: 25,
      page: 0,
      name: "hat",
    });

    const url = String(fetchMock.mock.calls[0][0]);
    expect(url.startsWith(`${API_URL}/v1/category?`)).toBe(true);
    const params = new URL(url).searchParams;
    expect(params.get("store")).toBe("DEFAULT");
    expect(params.get("lang")).toBe("en");
    expect(params.get("count")).toBe("25");
    expect(params.get("page")).toBe("0");
    expect(params.get("name")).toBe("hat");
  });

  it("uses the Angular v1 category write paths", async () => {
    const fetchMock = mockFetch({});

    await getCategoryById(9);
    await addCategory({ code: "hats" });
    await updateCategory(9, { code: "hats" });
    await updateCategoryVisibility({ id: 9, code: "hats", visible: true });
    await deleteCategory(9);
    await checkCategoryCode("hats");
    await updateHierarchy(9, -1);
    await listStoreNames();
    await getStoreLanguages("DEFAULT");

    const urls = fetchMock.mock.calls.map((call) => String(call[0]));
    const methods = fetchMock.mock.calls.map(
      (call) => (call[1] as RequestInit).method,
    );

    expect(urls[0]).toBe(`${API_URL}/v1/category/9?lang=_all`);
    expect(urls[1]).toBe(`${API_URL}/v1/private/category`);
    expect(methods[1]).toBe("POST");
    expect(urls[2]).toBe(`${API_URL}/v1/private/category/9`);
    expect(methods[2]).toBe("PUT");
    expect(urls[3]).toBe(`${API_URL}/v1/private/category/9/visible`);
    expect(methods[3]).toBe("PATCH");
    expect(urls[4]).toBe(`${API_URL}/v1/private/category/9`);
    expect(methods[4]).toBe("DELETE");
    expect(urls[5]).toBe(`${API_URL}/v1/private/category/unique?code=hats`);
    expect(urls[6]).toBe(`${API_URL}/v1/private/category/9/move/-1`);
    expect(methods[6]).toBe("PUT");
    expect(urls[7]).toBe(`${API_URL}/v1/private/stores/names?store=`);
    expect(urls[8]).toBe(`${API_URL}/v1/store/languages?store=DEFAULT`);
  });
});
