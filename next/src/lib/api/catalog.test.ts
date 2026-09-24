import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  checkBrandCode,
  createBrand,
  deleteBrand,
  fillEmptyBrandDescriptions,
  getBrandById,
  getListOfBrands,
  updateBrand,
} from "./brands";
import { getListOfProducts, getListOfStores, getStoreLanguages } from "./catalog";
import {
  addProductToGroup,
  createProductGroup,
  getListOfProductGroups,
  getProductsByGroup,
  removeProductFromGroup,
  removeProductGroup,
  updateGroupActiveValue,
} from "./product-groups";
import {
  checkTypeCode,
  createType,
  deleteType,
  getListOfTypes,
  getType,
  updateType,
} from "./product-types";

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

describe("catalogue APIs", () => {
  beforeEach(() => {
    process.env.SHOPIZER_API_URL = API_URL;
    localStorage.clear();
    localStorage.setItem("merchant", "DEFAULT");
    localStorage.setItem("lang", "en");
    localStorage.setItem("token", "jwt");
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    localStorage.clear();
  });

  it("lists brands with store, lang, count, and 0-based page", async () => {
    const fetchMock = mockFetch({ recordsTotal: 1, manufacturers: [] });
    await getListOfBrands({
      store: "DEFAULT",
      lang: "en",
      count: 25,
      page: 0,
    });
    expect(String(fetchMock.mock.calls[0][0])).toBe(
      `${API_URL}/v1/private/manufacturers/?store=DEFAULT&lang=en&count=25&page=0`,
    );
  });

  it("uses Angular manufacturer paths for get/create/update/delete/unique", async () => {
    const fetchMock = mockFetch({ exists: false });
    await getBrandById(9);
    await createBrand({ code: "nike" });
    await updateBrand(9, { code: "nike" });
    await deleteBrand(9);
    await checkBrandCode("nike");

    expect(fetchMock.mock.calls.map((call) => [call[0], (call[1] as RequestInit).method])).toEqual([
      [`${API_URL}/v1/manufacturers/9?lang=_all`, "GET"],
      [`${API_URL}/v1/private/manufacturer`, "POST"],
      [`${API_URL}/v1/private/manufacturer/9`, "PUT"],
      [`${API_URL}/v1/manufacturer/9`, "DELETE"],
      [`${API_URL}/v1/private/manufacturer/unique?code=nike`, "GET"],
    ]);
  });

  it("uses product type paths including unique?code= plus store/lang", async () => {
    const fetchMock = mockFetch({ exists: false, list: [], recordsTotal: 0 });
    await getListOfTypes({ store: "DEFAULT", lang: "en", count: 15, page: 0 });
    await getType(3, { lang: "_all", store: "DEFAULT" });
    await createType({ code: "general" });
    await updateType(3, { allowAddToCart: true });
    await deleteType(3);
    await checkTypeCode("general");

    expect(fetchMock.mock.calls.map((call) => String(call[0]))).toEqual([
      `${API_URL}/v1/private/products/types?store=DEFAULT&lang=en&count=15&page=0`,
      `${API_URL}/v1/private/products/type/3?lang=_all&store=DEFAULT`,
      `${API_URL}/v1/private/products/type?store=DEFAULT&lang=en`,
      `${API_URL}/v1/private/products/type/3?store=DEFAULT&lang=en`,
      `${API_URL}/v1/private/products/type/3?store=DEFAULT&lang=en`,
      `${API_URL}/v1/private/products/type/unique?code=general&store=DEFAULT&lang=en`,
    ]);
    expect((fetchMock.mock.calls[2][1] as RequestInit).method).toBe("POST");
    expect((fetchMock.mock.calls[3][1] as RequestInit).method).toBe("PUT");
    expect((fetchMock.mock.calls[4][1] as RequestInit).method).toBe("DELETE");
  });

  it("uses product group paths for list/create/patch/products/delete", async () => {
    const fetchMock = mockFetch([]);
    await getListOfProductGroups("DEFAULT");
    await createProductGroup({ code: "featured", active: true });
    await updateGroupActiveValue({ code: "featured", active: false });
    await addProductToGroup(12, "featured");
    await removeProductFromGroup(12, "featured");
    await getProductsByGroup("featured", { store: "DEFAULT", lang: "en" });
    await removeProductGroup("featured");
    await getListOfProducts({ store: "DEFAULT", lang: "en", count: 50, page: 0 });
    await getListOfStores({ code: "DEFAULT" });
    await getStoreLanguages("DEFAULT");

    expect(fetchMock.mock.calls.map((call) => [String(call[0]), (call[1] as RequestInit).method])).toEqual(
      [
        [`${API_URL}/v1/private/product/groups?store=DEFAULT`, "GET"],
        [`${API_URL}/v1/private/product/group`, "POST"],
        [`${API_URL}/v1/private/product/group/featured`, "PATCH"],
        [`${API_URL}/v1/private/product/12/group/featured`, "POST"],
        [`${API_URL}/v1/private/product/12/group/featured`, "DELETE"],
        [`${API_URL}/v1/product/group/featured?store=DEFAULT&lang=en`, "GET"],
        [`${API_URL}/v1/product/group/featured`, "DELETE"],
        [`${API_URL}/v2/products?store=DEFAULT&lang=en&count=50&page=0`, "GET"],
        [`${API_URL}/v1/private/stores?code=DEFAULT`, "GET"],
        [`${API_URL}/v1/store/languages?store=DEFAULT`, "GET"],
      ],
    );
  });
});

describe("fillEmptyBrandDescriptions", () => {
  it("copies the first name and friendlyUrl into empty locales", () => {
    const filled = fillEmptyBrandDescriptions([
      {
        language: "en",
        name: "Nike",
        highlights: "",
        friendlyUrl: "nike",
        description: "shoes",
        title: "",
        keyWords: "",
        metaDescription: "",
      },
      {
        language: "fr",
        name: "",
        highlights: "",
        friendlyUrl: "",
        description: "",
        title: "",
        keyWords: "",
        metaDescription: "",
      },
    ]);
    expect(filled?.[1]).toMatchObject({
      language: "fr",
      name: "Nike",
      friendlyUrl: "nike",
      description: "shoes",
    });
  });

  it("returns null when name or friendlyUrl is missing", () => {
    expect(
      fillEmptyBrandDescriptions([
        {
          language: "en",
          name: "",
          highlights: "",
          friendlyUrl: "",
          description: "",
          title: "",
          keyWords: "",
          metaDescription: "",
        },
      ]),
    ).toBeNull();
  });
});
