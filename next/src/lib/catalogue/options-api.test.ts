import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { client } from "@/lib/api/client";

import {
  checkOptionCode,
  checkOptionSetCode,
  checkVariationCode,
  createOption,
  createOptionSet,
  createOptionValueImage,
  createVariation,
  deleteOption,
  deleteOptionSet,
  deleteOptionValueImage,
  getOptionById,
  getOptionSetById,
  listOptionSets,
  listOptionValues,
  listOptions,
  listProductTypes,
  listVariations,
  updateOptionSet,
} from "./options-api";

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

describe("options api", () => {
  beforeEach(() => {
    process.env.SHOPIZER_API_URL = API_URL;
    localStorage.clear();
    localStorage.setItem("merchant", "DEFAULT");
    localStorage.setItem("lang", "en");
    localStorage.setItem("token", "jwt");
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
    localStorage.clear();
  });

  it("lists options on /v1/private/product/options with store/lang/count/page", async () => {
    const fetchMock = mockFetch({ options: [], recordsTotal: 0 });

    await listOptions({ store: "DEFAULT", lang: "en", count: 15, page: 0 });

    expect(fetchMock.mock.calls[0][0]).toBe(
      `${API_URL}/v1/private/product/options?store=DEFAULT&lang=en&count=15&page=0`,
    );
  });

  it("loads an option with lang=_all", async () => {
    const fetchMock = mockFetch({ id: 3, code: "SIZE" });

    await getOptionById(3);

    expect(fetchMock.mock.calls[0][0]).toBe(
      `${API_URL}/v1/private/product/option/3?lang=_all`,
    );
  });

  it("creates an option on /v1/private/product/option", async () => {
    const fetchMock = mockFetch({ id: 9 });

    await createOption({
      code: "SIZE",
      type: "select",
      selectedLanguage: "en",
      descriptions: [{ language: "en", name: "Size" }],
    });

    expect(fetchMock.mock.calls[0][0]).toBe(
      `${API_URL}/v1/private/product/option`,
    );
    expect((fetchMock.mock.calls[0][1] as RequestInit).method).toBe("POST");
  });

  it("deletes an option by id", async () => {
    const fetchMock = mockFetch();

    await deleteOption(4);

    expect(fetchMock.mock.calls[0][0]).toBe(
      `${API_URL}/v1/private/product/option/4`,
    );
    expect((fetchMock.mock.calls[0][1] as RequestInit).method).toBe("DELETE");
  });

  it("checks option uniqueness with a code query", async () => {
    const fetchMock = mockFetch({ exists: false });

    await checkOptionCode("SIZE");

    expect(fetchMock.mock.calls[0][0]).toBe(
      `${API_URL}/v1/private/product/option/unique?code=SIZE`,
    );
  });

  it("lists option values on /v1/private/product/options/values", async () => {
    const fetchMock = mockFetch({ optionValues: [], recordsTotal: 0 });

    await listOptionValues({ store: "DEFAULT", lang: "en", count: 15, page: 1 });

    expect(fetchMock.mock.calls[0][0]).toBe(
      `${API_URL}/v1/private/product/options/values?store=DEFAULT&lang=en&count=15&page=1`,
    );
  });

  it("uploads option-value images as FormData", async () => {
    const fetchMock = mockFetch();
    const file = new File(["img"], "swatch.png", { type: "image/png" });

    await createOptionValueImage(12, file);

    const init = fetchMock.mock.calls[0][1] as RequestInit;
    expect(fetchMock.mock.calls[0][0]).toBe(
      `${API_URL}/v1/private/product/option/value/12/image`,
    );
    expect(init.body).toBeInstanceOf(FormData);
    expect((init.body as FormData).get("file")).toBeInstanceOf(File);
    expect(new Headers(init.headers).get("Content-Type")).toBeNull();
  });

  it("deletes option-value images", async () => {
    const fetchMock = mockFetch();

    await deleteOptionValueImage(12);

    expect(fetchMock.mock.calls[0][0]).toBe(
      `${API_URL}/v1/private/product/option/value/12/image`,
    );
    expect((fetchMock.mock.calls[0][1] as RequestInit).method).toBe("DELETE");
  });

  it("lists option sets with store and lang", async () => {
    const fetchMock = mockFetch([]);

    await listOptionSets();

    expect(fetchMock.mock.calls[0][0]).toBe(
      `${API_URL}/v1/private/product/property/set?store=DEFAULT&lang=en`,
    );
  });

  it("loads, creates, and updates option sets on /v1 property/set", async () => {
    const fetchMock = mockFetch({ id: 2 });

    await getOptionSetById(2);
    await createOptionSet({
      readOnly: false,
      code: "SET1",
      option: 1,
      optionValues: [2, 3],
      productTypes: [4],
    });
    await updateOptionSet(2, {
      readOnly: true,
      option: 1,
      optionValues: [2],
      productTypes: [],
    });
    await deleteOptionSet(2);

    expect(fetchMock.mock.calls.map((call) => [call[0], (call[1] as RequestInit).method])).toEqual(
      [
        [`${API_URL}/v1/private/product/property/set/2?store=DEFAULT&lang=en`, "GET"],
        [
          `${API_URL}/v1/private/product/property/set?store=DEFAULT&lang=en`,
          "POST",
        ],
        [
          `${API_URL}/v1/private/product/property/set/2?store=DEFAULT&lang=en`,
          "PUT",
        ],
        [
          `${API_URL}/v1/private/product/property/set/2?store=DEFAULT&lang=en`,
          "DELETE",
        ],
      ],
    );
  });

  it("checks option-set uniqueness with a path query", async () => {
    const fetchMock = mockFetch({ exists: true });

    await checkOptionSetCode("SET1");

    expect(fetchMock.mock.calls[0][0]).toBe(
      `${API_URL}/v1/private/product/property/set/unique?code=SET1`,
    );
  });

  it("lists product types as an option-set lookup only", async () => {
    const fetchMock = mockFetch({ list: [] });

    await listProductTypes();

    expect(fetchMock.mock.calls[0][0]).toBe(
      `${API_URL}/v1/private/products/types?store=DEFAULT&lang=en`,
    );
  });

  it("uses /v2 for variations list, create, and unique", async () => {
    const fetchMock = mockFetch({ items: [] });

    await listVariations();
    await createVariation({ code: "RED", option: 1, optionValue: 2 });
    await checkVariationCode("RED");

    expect(fetchMock.mock.calls.map((call) => call[0])).toEqual([
      `${API_URL}/v2/private/product/variation`,
      `${API_URL}/v2/private/product/variation`,
      `${API_URL}/v2/private/product/variation/unique?code=RED`,
    ]);
    expect((fetchMock.mock.calls[1][1] as RequestInit).method).toBe("POST");
  });

  it("attaches the Bearer token on option requests", async () => {
    mockFetch({ options: [] });
    await listOptions({ store: "DEFAULT", lang: "en" });
    const init = (vi.mocked(fetch).mock.calls[0][1] ?? {}) as RequestInit;
    expect(new Headers(init.headers).get("Authorization")).toBe("Bearer jwt");
  });

  it("exposes the same client helpers used by Angular crud", () => {
    expect(client.get).toBeTypeOf("function");
    expect(client.post).toBeTypeOf("function");
    expect(client.put).toBeTypeOf("function");
    expect(client.delete).toBeTypeOf("function");
  });
});
