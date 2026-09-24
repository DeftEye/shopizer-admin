import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { I18nProvider } from "@/components/i18n-provider";

import InventoryListPage from "./page";

const push = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push, replace: vi.fn(), back: vi.fn() }),
  useParams: () => ({ productId: "12" }),
}));

vi.mock("next/link", () => ({
  default: ({
    href,
    children,
    ...props
  }: {
    href: string;
    children: React.ReactNode;
  }) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

function mockFetch() {
  const fetchMock = vi.fn(async (url: string, _init?: RequestInit) => {
    const path = String(url);
    if (path.includes("/v1/product/12?") || path.endsWith("/v1/product/12")) {
      return {
        ok: true,
        status: 200,
        statusText: "OK",
        text: async () =>
          JSON.stringify({ id: 12, description: { name: "Bag" } }),
      };
    }
    if (path.includes("/inventory")) {
      return {
        ok: true,
        status: 200,
        statusText: "OK",
        text: async () =>
          JSON.stringify({
            recordsTotal: 1,
            items: [
              {
                id: 4,
                store: { code: "DEFAULT" },
                owner: null,
                quantity: 3,
                prices: [{ originalPrice: "CAD10.00" }],
                creationDate: "2026-01-01",
              },
            ],
          }),
      };
    }
    return { ok: true, status: 200, statusText: "OK", text: async () => "{}" };
  });
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
}

describe("inventory list", () => {
  beforeEach(() => {
    process.env.SHOPIZER_API_URL = "http://localhost:8080/api";
    localStorage.setItem("token", "jwt");
    localStorage.setItem("lang", "en");
    push.mockReset();
    mockFetch();
  });

  afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
    localStorage.clear();
  });

  it("lists inventory and deletes after confirm", async () => {
    const fetchMock = mockFetch();
    render(
      <I18nProvider defaultLang="en" langs={["en"]}>
        <InventoryListPage />
      </I18nProvider>,
    );

    await waitFor(() => {
      expect(screen.getByText("Bag")).toBeTruthy();
      expect(screen.getByText("DEFAULT")).toBeTruthy();
    });

    fireEvent.click(screen.getByRole("button", { name: "Remove" }));
    fireEvent.click(screen.getByRole("button", { name: "Ok" }));

    await waitFor(() => {
      expect(
        fetchMock.mock.calls.some(
          (call) =>
            String(call[0]).includes("/v1/private/product/inventory/4") &&
            (call[1] as RequestInit | undefined)?.method === "DELETE",
        ),
      ).toBe(true);
    });
  });
});
