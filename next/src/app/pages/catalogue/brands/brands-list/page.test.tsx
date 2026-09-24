import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { I18nProvider } from "@/components/i18n-provider";
import { EMPTY_ROLE_FLAGS } from "@/lib/auth/roles";

import BrandsListPage from "./page";

const push = vi.fn();
const replace = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push, replace }),
}));

function jsonResponse(body: unknown) {
  return {
    ok: true,
    status: 200,
    statusText: "OK",
    text: async () => JSON.stringify(body),
  };
}

function mockCatalogFetch() {
  const fetchMock = vi.fn(async (url: string, init?: RequestInit) => {
    const path = String(url);
    if (path.includes("/v1/private/manufacturers/")) {
      return jsonResponse({
        recordsTotal: 1,
        manufacturers: [
          { id: 7, code: "nike", description: { name: "Nike" } },
        ],
      });
    }
    if (path.includes("/v1/manufacturer/7") && init?.method === "DELETE") {
      return jsonResponse(null);
    }
    if (path.includes("/v1/private/stores")) {
      return jsonResponse({ data: [{ code: "DEFAULT" }] });
    }
    return jsonResponse({});
  });
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
}

function renderPage() {
  return render(
    <I18nProvider defaultLang="en" langs={["en", "fr"]}>
      <BrandsListPage />
    </I18nProvider>,
  );
}

describe("brands list", () => {
  beforeEach(() => {
    localStorage.clear();
    localStorage.setItem("token", "jwt");
    localStorage.setItem("merchant", "DEFAULT");
    localStorage.setItem("lang", "en");
    localStorage.setItem(
      "roles",
      JSON.stringify({ ...EMPTY_ROLE_FLAGS, isAdmin: true }),
    );
    push.mockReset();
    replace.mockReset();
    mockCatalogFetch();
  });

  afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
    localStorage.clear();
  });

  it("lists brands and deletes after confirm", async () => {
    renderPage();

    await waitFor(() => {
      expect(screen.getByText("Nike")).toBeTruthy();
      expect(screen.getByText("nike")).toBeTruthy();
    });

    fireEvent.click(screen.getByRole("button", { name: "Remove" }));
    fireEvent.click(screen.getByRole("button", { name: "Ok" }));

    await waitFor(() => {
      expect(screen.getByText("Store removed.")).toBeTruthy();
    });
  });
});
