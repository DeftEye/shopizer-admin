import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { I18nProvider } from "@/components/i18n-provider";

import { ProductAttributesPanel } from "./product-attributes-panel";

function mockFetch() {
  const fetchMock = vi.fn(async (url: string, init?: RequestInit) => {
    const path = String(url);
    if (path.includes("/attributes") && (!init?.method || init.method === "GET")) {
      return {
        ok: true,
        status: 200,
        statusText: "OK",
        text: async () =>
          JSON.stringify({
            recordsTotal: 2,
            attributes: [
              {
                id: 7,
                attributeDisplayOnly: false,
                option: { code: "color" },
                optionValue: { code: "red" },
                productAttributePrice: "1.00",
                sortOrder: 1,
              },
              {
                id: 8,
                attributeDisplayOnly: true,
                option: { code: "hidden" },
                optionValue: { code: "x" },
                productAttributePrice: "0",
                sortOrder: 2,
              },
            ],
          }),
      };
    }
    if (path.includes("/options/values")) {
      return {
        ok: true,
        status: 200,
        statusText: "OK",
        text: async () => JSON.stringify({ optionValues: [{ code: "red" }] }),
      };
    }
    if (path.includes("/options")) {
      return {
        ok: true,
        status: 200,
        statusText: "OK",
        text: async () => JSON.stringify({ options: [{ code: "color" }] }),
      };
    }
    return { ok: true, status: 200, statusText: "OK", text: async () => "{}" };
  });
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
}

describe("product attributes", () => {
  beforeEach(() => {
    process.env.SHOPIZER_API_URL = "http://localhost:8080/api";
    localStorage.setItem("token", "jwt");
    localStorage.setItem("merchant", "DEFAULT");
    mockFetch();
  });

  afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
    localStorage.clear();
  });

  it("hides display-only rows and deletes after confirm", async () => {
    const fetchMock = mockFetch();
    render(
      <I18nProvider defaultLang="en" langs={["en"]}>
        <ProductAttributesPanel productId="12" />
      </I18nProvider>,
    );

    await waitFor(() => {
      expect(screen.getByText("color")).toBeTruthy();
    });
    expect(screen.queryByText("hidden")).toBeNull();

    fireEvent.click(screen.getByRole("button", { name: "Remove" }));
    fireEvent.click(screen.getByRole("button", { name: "Ok" }));

    await waitFor(() => {
      expect(
        fetchMock.mock.calls.some(
          (call) =>
            String(call[0]).includes("/v1/private/product/12/attribute/7") &&
            (call[1] as RequestInit).method === "DELETE",
        ),
      ).toBe(true);
    });
  });
});
