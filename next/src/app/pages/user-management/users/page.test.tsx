import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { I18nProvider } from "@/components/i18n-provider";

import UsersListPage from "./page";

const push = vi.fn();
const replace = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push, replace }),
}));

function mockFetch() {
  const fetchMock = vi.fn(async (url: string) => {
    const path = String(url);
    if (path.includes("/v1/private/users?")) {
      return {
        ok: true,
        status: 200,
        statusText: "OK",
        text: async () =>
          JSON.stringify({
            data: [
              {
                id: 9,
                active: true,
                defaultLanguage: "en",
                emailAddress: "pat@shopizer.com",
                firstName: "Pat",
                lastName: "Lee",
                groups: [{ name: "ADMIN" }],
                lastAccess: "",
                loginTime: "",
                merchant: "DEFAULT",
                permissions: [],
                userName: "pat@shopizer.com",
              },
            ],
            recordsTotal: 1,
            totalPages: 1,
          }),
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
      ok: false,
      status: 404,
      statusText: "Not Found",
      text: async () => "",
    };
  });
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
}

function renderPage() {
  return render(
    <I18nProvider defaultLang="en" langs={["en", "fr"]}>
      <UsersListPage />
    </I18nProvider>,
  );
}

describe("users list page", () => {
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
    push.mockReset();
    replace.mockReset();
    mockFetch();
  });

  afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
    localStorage.clear();
  });

  it("lists users with store/lang/count/page and opens details", async () => {
    const fetchMock = mockFetch();
    renderPage();

    await waitFor(() => {
      expect(screen.getByText("pat@shopizer.com")).toBeTruthy();
    });

    const listCall = fetchMock.mock.calls.find((call) =>
      String(call[0]).includes("/v1/private/users?"),
    );
    expect(String(listCall?.[0])).toContain("store=DEFAULT");
    expect(String(listCall?.[0])).toContain("count=15");
    expect(String(listCall?.[0])).toContain("page=0");

    fireEvent.click(screen.getByRole("button", { name: "Edit" }));
    expect(push).toHaveBeenCalledWith("/pages/user-management/user/9");
  });

  it("sends a non-admin away from the list", async () => {
    localStorage.setItem(
      "roles",
      JSON.stringify({
        canAccessToOrder: false,
        isSuperadmin: false,
        isAdmin: false,
        isAdminCatalogue: false,
        isAdminStore: false,
        isAdminOrder: false,
        isAdminContent: false,
        isCustomer: true,
        isAdminRetail: false,
      }),
    );
    renderPage();
    await waitFor(() => {
      expect(replace).toHaveBeenCalledWith("/pages/home");
    });
  });
});
