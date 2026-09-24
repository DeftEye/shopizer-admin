import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { ApiError, client, clearSession } from "./client";

const API_URL = "http://localhost:8080/api";
const SHIPPING_URL = "http://localhost:9090/shipping/api/v1";

function mockFetch(response: Partial<Response> & { jsonBody?: unknown } = {}) {
  const fetchMock = vi.fn().mockResolvedValue({
    ok: response.ok ?? true,
    status: response.status ?? 200,
    statusText: response.statusText ?? "OK",
    text: async () =>
      response.jsonBody === undefined
        ? ""
        : JSON.stringify(response.jsonBody),
  });
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
}

describe("api client", () => {
  beforeEach(() => {
    process.env.SHOPIZER_API_URL = API_URL;
    process.env.SHOPIZER_SHIPPING_API_URL = SHIPPING_URL;
    localStorage.clear();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
    localStorage.clear();
  });

  it("get('/v1/private/user/profile') hits {SHOPIZER_API_URL}/v1/private/user/profile", async () => {
    const fetchMock = mockFetch({ jsonBody: { userName: "admin" } });

    await client.get("/v1/private/user/profile");

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fetchMock.mock.calls[0][0]).toBe(
      `${API_URL}/v1/private/user/profile`,
    );
  });

  it("sets the Bearer header when a token is present", async () => {
    localStorage.setItem("token", "jwt-token");
    const fetchMock = mockFetch({ jsonBody: {} });

    await client.get("/v1/private/user/profile");

    const init = fetchMock.mock.calls[0][1] as RequestInit;
    const headers = new Headers(init.headers);
    expect(headers.get("Authorization")).toBe("Bearer jwt-token");
  });

  it("clears the token on HTTP 401", async () => {
    localStorage.setItem("token", "expired");
    localStorage.setItem("userId", "1");
    localStorage.setItem("roles", "{}");
    localStorage.setItem("merchant", "DEFAULT");
    mockFetch({ ok: false, status: 401, statusText: "Unauthorized" });

    await expect(client.get("/v1/private/user/profile")).rejects.toBeInstanceOf(
      ApiError,
    );

    expect(localStorage.getItem("token")).toBeNull();
    expect(localStorage.getItem("userId")).toBeNull();
    expect(localStorage.getItem("roles")).toBeNull();
    expect(localStorage.getItem("merchant")).toBeNull();
  });

  it("uses SHOPIZER_SHIPPING_API_URL for shipping methods", async () => {
    const fetchMock = mockFetch({ jsonBody: [] });

    await client.getShipping("/private/rules");
    await client.postShipping("/private/criterias", { name: "weight" });
    await client.putShipping("/private/actions/1", { id: 1 });
    await client.deleteShipping("/private/rules/1");

    expect(fetchMock.mock.calls.map((call) => call[0])).toEqual([
      `${SHIPPING_URL}/private/rules`,
      `${SHIPPING_URL}/private/criterias`,
      `${SHIPPING_URL}/private/actions/1`,
      `${SHIPPING_URL}/private/rules/1`,
    ]);
    expect(
      (fetchMock.mock.calls[1][1] as RequestInit).method,
    ).toBe("POST");
    expect((fetchMock.mock.calls[2][1] as RequestInit).method).toBe("PUT");
    expect((fetchMock.mock.calls[3][1] as RequestInit).method).toBe("DELETE");
  });

  it("clearSession removes Angular session keys", () => {
    localStorage.setItem("token", "jwt");
    localStorage.setItem("userId", "9");
    clearSession();
    expect(localStorage.getItem("token")).toBeNull();
    expect(localStorage.getItem("userId")).toBeNull();
  });
});
