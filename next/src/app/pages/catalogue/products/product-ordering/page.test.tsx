import { cleanup, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { I18nProvider } from "@/components/i18n-provider";

import ProductOrderingPage from "./page";

function jsonResponse(body: unknown) {
  return {
    ok: true,
    status: 200,
    statusText: "OK",
    text: async () => JSON.stringify(body),
  };
}

function mockFetch() {
  const fetchMock = vi.fn(async (url: string) => {
    const path = String(url);
    if (path.includes("/v1/product")) {
      return jsonResponse({
        products: [
          {
            id: 3,
            name: "Bag",
            sku: "BAG",
            quantity: 1,
            price: "5",
            creationDate: "2024-02-02",
          },
        ],
      });
    }
    if (path.includes("/v1/category")) {
      return jsonResponse({
        categories: [{ id: 8, code: "root", description: { name: "Root" } }],
      });
    }
    return {
      ok: false,
      status: 404,
      statusText: "Not Found",
      text: async () => "",
    };
  });
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
}

describe("product ordering", () => {
  beforeEach(() => {
    localStorage.clear();
    localStorage.setItem("lang", "fr");
    mockFetch();
  });

  afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
    localStorage.clear();
  });

  it("loads /v1/product with Angular's count/lang/page and categories for the picker", async () => {
    render(
      <I18nProvider defaultLang="en" langs={["en", "fr"]}>
        <ProductOrderingPage />
      </I18nProvider>,
    );

    await waitFor(() => {
      expect(screen.getByText("BAG")).toBeTruthy();
      expect(screen.getByText("Bag")).toBeTruthy();
    });

    const fetchMock = fetch as unknown as ReturnType<typeof vi.fn>;
    const urls = fetchMock.mock.calls.map((call) => String(call[0]));
    expect(
      urls.some((url) => url.includes("/v1/product?count=200&lang=en&page=0")),
    ).toBe(true);
    expect(
      urls.some((url) => url.includes("/v1/category?count=50&page=0&lang=fr")),
    ).toBe(true);
  });
});
