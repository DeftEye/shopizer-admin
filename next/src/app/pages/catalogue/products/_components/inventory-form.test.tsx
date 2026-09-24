import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { I18nProvider } from "@/components/i18n-provider";

import { InventoryForm } from "./inventory-form";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn(), back: vi.fn() }),
}));

function mockFetch() {
  const fetchMock = vi.fn(async (url: string, init?: RequestInit) => {
    const path = String(url);
    if (path.includes("/stores")) {
      return {
        ok: true,
        status: 200,
        statusText: "OK",
        text: async () => JSON.stringify({ data: [{ code: "DEFAULT" }] }),
      };
    }
    if (path.includes("/languages")) {
      return {
        ok: true,
        status: 200,
        statusText: "OK",
        text: async () => JSON.stringify([{ code: "en" }]),
      };
    }
    if (init?.method === "POST") {
      return {
        ok: true,
        status: 200,
        statusText: "OK",
        text: async () => JSON.stringify({ id: 9 }),
      };
    }
    return { ok: true, status: 200, statusText: "OK", text: async () => "{}" };
  });
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
}

describe("inventory form", () => {
  beforeEach(() => {
    process.env.SHOPIZER_API_URL = "http://localhost:8080/api";
    localStorage.setItem("token", "jwt");
    localStorage.setItem("merchant", "DEFAULT");
  });

  afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
    localStorage.clear();
  });

  it("posts create inventory to /v1/private/product/inventory", async () => {
    const fetchMock = mockFetch();
    render(
      <I18nProvider defaultLang="en" langs={["en"]}>
        <InventoryForm productId="12" inventory={{}} titleKey="COMPONENTS.INVENTORY" />
      </I18nProvider>,
    );

    await waitFor(() => {
      expect(screen.getByLabelText(/Sku/i)).toBeTruthy();
    });

    fireEvent.change(screen.getByLabelText(/Sku/i), {
      target: { value: "SKU1" },
    });
    fireEvent.change(screen.getByLabelText(/Variant/i), {
      target: { value: "1" },
    });
    fireEvent.change(screen.getByLabelText(/Final price/i), {
      target: { value: "10" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Save" }));

    await waitFor(() => {
      const post = fetchMock.mock.calls.find(
        (call) => (call[1] as RequestInit).method === "POST",
      );
      expect(post?.[0]).toBe("http://localhost:8080/api/v1/private/product/inventory");
      const body = JSON.parse(String((post?.[1] as RequestInit).body));
      expect(body.productId).toBe("12");
      expect(body.sku).toBe("SKU1");
      expect(body.prices).toEqual([]);
    });
  });
});
