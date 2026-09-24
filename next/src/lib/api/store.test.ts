import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { ApiError } from "./client";
import {
  addStoreLogo,
  asStoreList,
  checkIfStoreExist,
  createPageContent,
  createStore,
  deleteStore,
  getListOfMerchantStoreNames,
  getListOfStores,
  getPageContent,
  getStore,
  removeStoreLogo,
  storeCodeTaken,
  updateStore,
} from "./store";

const API_URL = "http://localhost:8080/api";

function jsonResponse(body: unknown, status = 200) {
  return {
    ok: status >= 200 && status < 300,
    status,
    statusText: status === 200 ? "OK" : "Error",
    text: async () => (body === undefined ? "" : JSON.stringify(body)),
  };
}

describe("store api", () => {
  beforeEach(() => {
    process.env.SHOPIZER_API_URL = API_URL;
    localStorage.clear();
    localStorage.setItem("merchant", "DEFAULT");
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
    localStorage.clear();
  });

  it("hits the Angular store paths and query names", async () => {
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse({}));
    vi.stubGlobal("fetch", fetchMock);

    await getStore("DEFAULT");
    await getListOfStores({ store: "DEFAULT", count: 10, page: 0, name: "Shop" });
    await getListOfMerchantStoreNames({ name: "de" });
    await checkIfStoreExist("NEWSTORE");
    await createStore({ code: "NEWSTORE" });
    await updateStore({ code: "DEFAULT", name: "Default" });
    await deleteStore("OTHER");

    expect(fetchMock.mock.calls.map((call) => String(call[0]))).toEqual([
      `${API_URL}/v1/store/DEFAULT`,
      `${API_URL}/v1/private/stores?store=DEFAULT&count=10&page=0&name=Shop`,
      `${API_URL}/v1/private/stores/names?name=de`,
      `${API_URL}/v1/private/store/unique?code=NEWSTORE`,
      `${API_URL}/v1/private/store`,
      `${API_URL}/v1/private/store/DEFAULT`,
      `${API_URL}/v1/private/store/OTHER`,
    ]);
    expect((fetchMock.mock.calls[4][1] as RequestInit).method).toBe("POST");
    expect((fetchMock.mock.calls[5][1] as RequestInit).method).toBe("PUT");
    expect((fetchMock.mock.calls[6][1] as RequestInit).method).toBe("DELETE");
  });

  it("treats both exist and exists as a taken store code", () => {
    expect(storeCodeTaken({ exists: true })).toBe(true);
    expect(storeCodeTaken({ exist: true })).toBe(true);
    expect(storeCodeTaken({ exists: false })).toBe(false);
    expect(storeCodeTaken({})).toBe(false);
  });

  it("returns null for landing content on 404 (Angular getWithEmpty)", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => jsonResponse({ status: 404 }, 404)),
    );

    await expect(getPageContent("LANDING_PAGE", "DEFAULT")).resolves.toBeNull();
  });

  it("posts landing content with ?store=", async () => {
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse({}));
    vi.stubGlobal("fetch", fetchMock);

    await createPageContent({ code: "LANDING_PAGE" }, "DEFAULT");

    expect(String(fetchMock.mock.calls[0][0])).toBe(
      `${API_URL}/v1/private/content?store=DEFAULT`,
    );
  });

  it("uploads the logo as FormData to the session merchant", async () => {
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse({}));
    vi.stubGlobal("fetch", fetchMock);
    const file = new File(["logo"], "logo.png", { type: "image/png" });

    await addStoreLogo(file);
    await removeStoreLogo("OTHER");

    const init = fetchMock.mock.calls[0][1] as RequestInit;
    expect(String(fetchMock.mock.calls[0][0])).toBe(
      `${API_URL}/v1/private/store/DEFAULT/marketing/logo`,
    );
    expect(init.body).toBeInstanceOf(FormData);
    expect((init.body as FormData).get("file")).toBeInstanceOf(File);
    expect(String(fetchMock.mock.calls[1][0])).toBe(
      `${API_URL}/v1/private/store/OTHER/marketing/logo`,
    );
  });

  it("normalizes list payloads", () => {
    expect(asStoreList([{ code: "A" }]).recordsTotal).toBe(1);
    expect(asStoreList({ data: [{ code: "A" }], recordsTotal: 9 }).recordsTotal).toBe(9);
  });

  it("treats HTTP errors as empty landing content", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => jsonResponse({ message: "down" }, 500)),
    );
    await expect(getPageContent("LANDING_PAGE", "DEFAULT")).resolves.toBeNull();
    expect(ApiError).toBeDefined();
  });
});
