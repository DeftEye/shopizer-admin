import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { I18nProvider } from "@/components/i18n-provider";

import { ProductImagesPanel } from "./product-images-panel";

function mockFetch() {
  const fetchMock = vi.fn(async (url: string, init?: RequestInit) => {
    const path = String(url);
    if (path.includes("/images") && (!init?.method || init.method === "GET")) {
      return {
        ok: true,
        status: 200,
        statusText: "OK",
        text: async () =>
          JSON.stringify([{ id: 3, imageUrl: "/img.png", path: "img.png" }]),
      };
    }
    return {
      ok: true,
      status: 200,
      statusText: "OK",
      text: async () => "{}",
    };
  });
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
}

function renderPanel() {
  return render(
    <I18nProvider defaultLang="en" langs={["en"]}>
      <ProductImagesPanel productId="12" />
    </I18nProvider>,
  );
}

describe("product images", () => {
  beforeEach(() => {
    process.env.SHOPIZER_API_URL = "http://localhost:8080/api";
    localStorage.setItem("token", "jwt");
    mockFetch();
  });

  afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
    localStorage.clear();
  });

  it("loads images and deletes with the Angular path", async () => {
    const fetchMock = mockFetch();
    renderPanel();

    await waitFor(() => {
      expect(screen.getByAltText("img.png")).toBeTruthy();
    });

    fireEvent.click(screen.getByRole("button", { name: "Remove" }));

    await waitFor(() => {
      expect(
        fetchMock.mock.calls.some(
          (call) =>
            String(call[0]).includes("/v1/private/product/12/image/3") &&
            (call[1] as RequestInit).method === "DELETE",
        ),
      ).toBe(true);
    });
  });
});
