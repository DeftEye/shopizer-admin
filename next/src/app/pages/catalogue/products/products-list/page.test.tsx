import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { I18nProvider } from "@/components/i18n-provider";

import ProductsListPage from "./page";

const push = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push, replace: vi.fn() }),
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

function jsonResponse(body: unknown) {
  return {
    ok: true,
    status: 200,
    statusText: "OK",
    text: async () => JSON.stringify(body),
  };
}

function mockFetch() {
  const fetchMock = vi.fn(async (url: string, init?: RequestInit) => {
    const path = String(url);
    if (path.includes("/v2/products")) {
      return jsonResponse({
        recordsTotal: 1,
        products: [
          {
            id: 11,
            sku: "HAT",
            description: { name: "Red hat" },
            quantity: 4,
            available: true,
            price: "9.99",
            creationDate: "2024-01-01",
          },
        ],
      });
    }
    if (path.includes("/v1/private/stores")) {
      return jsonResponse({ data: [{ code: "DEFAULT" }, { code: "USA" }] });
    }
    if (path.includes("/v1/private/product/11") && init?.method === "DELETE") {
      return jsonResponse({});
    }
    if (path.includes("/v1/private/product/11") && init?.method === "PATCH") {
      return jsonResponse({});
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

function renderList() {
  return render(
    <I18nProvider defaultLang="en" langs={["en", "fr"]}>
      <ProductsListPage />
    </I18nProvider>,
  );
}

describe("products list", () => {
  beforeEach(() => {
    localStorage.clear();
    localStorage.setItem("token", "jwt");
    localStorage.setItem("merchant", "DEFAULT");
    localStorage.setItem("lang", "en");
    push.mockReset();
    mockFetch();
  });

  afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
    localStorage.clear();
  });

  it("loads /v2/products with store, lang, count, origin, and page", async () => {
    renderList();

    await waitFor(() => {
      expect(screen.getByText("HAT")).toBeTruthy();
      expect(screen.getByText("Red hat")).toBeTruthy();
    });

    const fetchMock = fetch as unknown as ReturnType<typeof vi.fn>;
    const listUrl = fetchMock.mock.calls
      .map((call) => String(call[0]))
      .find((url) => url.includes("/v2/products"));
    expect(listUrl).toBeTruthy();
    const params = new URL(listUrl as string, "http://local.invalid").searchParams;
    expect(params.get("store")).toBe("DEFAULT");
    expect(params.get("lang")).toBe("en");
    expect(params.get("count")).toBe("20");
    expect(params.get("page")).toBe("0");
    expect(params.get("origin")).toBe("admin");
  });

  it("patches availability and deletes through the v1 product paths", async () => {
    const confirm = vi.spyOn(window, "confirm").mockReturnValue(true);
    renderList();
    await waitFor(() => expect(screen.getByText("HAT")).toBeTruthy());

    fireEvent.click(screen.getByLabelText("Available HAT"));
    await waitFor(() => {
      expect(screen.getByText("Product updated.")).toBeTruthy();
    });

    fireEvent.click(screen.getByRole("button", { name: "Remove" }));
    await waitFor(() => {
      expect(screen.getByText("Product removed.")).toBeTruthy();
    });

    const fetchMock = fetch as unknown as ReturnType<typeof vi.fn>;
    const patch = fetchMock.mock.calls.find(
      (call) => (call[1] as RequestInit | undefined)?.method === "PATCH",
    );
    const del = fetchMock.mock.calls.find(
      (call) => (call[1] as RequestInit | undefined)?.method === "DELETE",
    );
    expect(String(patch?.[0])).toContain("/v1/private/product/11");
    expect(JSON.parse(String(patch?.[1]?.body))).toEqual({
      available: false,
      price: "9.99",
      quantity: 4,
    });
    expect(String(del?.[0])).toContain("/v1/private/product/11");
    expect(confirm).toHaveBeenCalled();
  });
});
