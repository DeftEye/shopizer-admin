import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { I18nProvider } from "@/components/i18n-provider";

import OptionsListPage from "./page";

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

function jsonResponse(jsonBody: unknown, status = 200) {
  return {
    ok: status >= 200 && status < 300,
    status,
    statusText: status === 200 ? "OK" : "Error",
    text: async () => JSON.stringify(jsonBody),
  };
}

function mockFetch() {
  const fetchMock = vi.fn(async (url: string, init?: RequestInit) => {
    const path = String(url);
    if (path.includes("/v1/private/product/options") && !path.includes("/option/")) {
      return jsonResponse({
        recordsTotal: 1,
        options: [
          {
            id: 7,
            code: "SIZE",
            type: "select",
            descriptions: [{ language: "en", name: "Size" }],
          },
        ],
      });
    }
    if (path.includes("/v1/private/product/option/7") && init?.method === "DELETE") {
      return jsonResponse({});
    }
    if (path.includes("/v1/private/stores")) {
      return jsonResponse({ data: [{ code: "DEFAULT" }] });
    }
    return jsonResponse({}, 404);
  });
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
}

function renderPage() {
  return render(
    <I18nProvider defaultLang="en" langs={["en", "fr"]}>
      <OptionsListPage />
    </I18nProvider>,
  );
}

describe("options list", () => {
  beforeEach(() => {
    localStorage.clear();
    localStorage.setItem("token", "jwt");
    localStorage.setItem("merchant", "DEFAULT");
    localStorage.setItem("lang", "en");
    process.env.SHOPIZER_API_URL = "http://localhost:8080/api";
    push.mockReset();
    vi.spyOn(window, "confirm").mockReturnValue(true);
  });

  afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
    localStorage.clear();
  });

  it("loads /v1 options and can delete a row", async () => {
    const fetchMock = mockFetch();
    renderPage();

    expect(await screen.findByText("Size")).toBeTruthy();
    expect(screen.getByText("7")).toBeTruthy();
    expect(screen.getByRole("link", { name: "Create option / property" })).toHaveProperty(
      "href",
      expect.stringContaining("/pages/catalogue/options/create-option"),
    );

    fireEvent.click(screen.getByRole("button", { name: "Remove" }));

    await waitFor(() => {
      expect(
        fetchMock.mock.calls.some(
          ([url, init]) =>
            String(url).includes("/v1/private/product/option/7") &&
            (init as RequestInit | undefined)?.method === "DELETE",
        ),
      ).toBe(true);
    });
    expect(await screen.findByText("Option removed.")).toBeTruthy();
  });
});
