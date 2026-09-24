import { cleanup, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { I18nProvider } from "@/components/i18n-provider";

import CreateUserPage from "./page";

const replace = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), replace }),
}));

function mockFetch() {
  const fetchMock = vi.fn(async (url: string) => {
    const path = String(url);
    if (path.includes("/v1/sec/private/groups")) {
      return {
        ok: true,
        status: 200,
        statusText: "OK",
        text: async () =>
          JSON.stringify([
            { id: 2, name: "ADMIN", type: "ADMIN" },
            { id: 3, name: "ADMIN_STORE", type: "ADMIN" },
          ]),
      };
    }
    if (path.includes("/v1/private/stores/names")) {
      return {
        ok: true,
        status: 200,
        statusText: "OK",
        text: async () => JSON.stringify([{ code: "DEFAULT" }]),
      };
    }
    return {
      ok: true,
      status: 200,
      statusText: "OK",
      text: async () => "[]",
    };
  });
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
}

function renderPage() {
  return render(
    <I18nProvider defaultLang="en" langs={["en", "fr"]}>
      <CreateUserPage />
    </I18nProvider>,
  );
}

describe("create user page", () => {
  beforeEach(() => {
    localStorage.clear();
    localStorage.setItem("token", "jwt");
    localStorage.setItem("userId", "1");
    localStorage.setItem("merchant", "DEFAULT");
    localStorage.setItem(
      "roles",
      JSON.stringify({
        canAccessToOrder: true,
        isSuperadmin: true,
        isAdmin: false,
        isAdminCatalogue: false,
        isAdminStore: false,
        isAdminOrder: false,
        isAdminContent: false,
        isCustomer: false,
        isAdminRetail: false,
      }),
    );
    replace.mockReset();
    mockFetch();
  });

  afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
    localStorage.clear();
  });

  it("loads groups and store names for the user form", async () => {
    const fetchMock = mockFetch();
    renderPage();

    await waitFor(() => {
      expect(screen.getByText("Create user")).toBeTruthy();
    });
    expect(
      fetchMock.mock.calls.some((call) =>
        String(call[0]).includes("/v1/sec/private/groups"),
      ),
    ).toBe(true);
    expect(
      fetchMock.mock.calls.some((call) =>
        String(call[0]).includes("/v1/private/stores/names"),
      ),
    ).toBe(true);
    expect(screen.getByLabelText(/First name/)).toBeTruthy();
  });
});
