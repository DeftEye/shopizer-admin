import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { I18nProvider } from "@/components/i18n-provider";

import { PriceForm } from "./price-form";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn(), back: vi.fn() }),
}));

function mockFetch() {
  const fetchMock = vi.fn(async (url: string, init?: RequestInit) => {
    const path = String(url);
    if (path.includes("/inventory/4") && (!init?.method || init.method === "GET")) {
      return {
        ok: true,
        status: 200,
        statusText: "OK",
        text: async () =>
          JSON.stringify({
            id: 4,
            store: { code: "DEFAULT" },
            prices: [],
          }),
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
    return { ok: true, status: 200, statusText: "OK", text: async () => "{}" };
  });
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
}

describe("price form", () => {
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

  it("saves a price by updating inventory", async () => {
    const fetchMock = mockFetch();
    render(
      <I18nProvider defaultLang="en" langs={["en"]}>
        <PriceForm productId="12" inventoryId="4" />
      </I18nProvider>,
    );

    await waitFor(() => {
      expect(screen.getByLabelText(/Final price/i)).toBeTruthy();
    });

    fireEvent.change(screen.getByLabelText(/Final price/i), {
      target: { value: "9" },
    });
    fireEvent.change(screen.getByLabelText(/Original price/i), {
      target: { value: "12" },
    });
    fireEvent.change(screen.getByLabelText(/Language/i), {
      target: { value: "en" },
    });
    await waitFor(() => {
      expect(screen.getByLabelText(/^Name/)).toBeTruthy();
    });
    fireEvent.change(screen.getByLabelText(/^Name/), {
      target: { value: "Retail" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Save" }));

    await waitFor(() => {
      const put = fetchMock.mock.calls.find(
        (call) => (call[1] as RequestInit).method === "PUT",
      );
      expect(put?.[0]).toBe(
        "http://localhost:8080/api/v1/private/product/12/inventory/4",
      );
      const body = JSON.parse(String((put?.[1] as RequestInit).body));
      expect(body.store).toBe("DEFAULT");
      expect(body.prices[0].finalPrice).toBe("9");
      expect(body.prices[0].descriptions[0].friendlyUrl).toBe("retail");
    });
  });
});
