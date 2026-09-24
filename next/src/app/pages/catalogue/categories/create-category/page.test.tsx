import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { I18nProvider } from "@/components/i18n-provider";

import CreateCategoryPage from "./page";

const push = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push, replace: vi.fn() }),
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
    if (path.includes("/v1/private/stores/names")) {
      return jsonResponse([{ code: "DEFAULT" }, { code: "USA" }]);
    }
    if (path.includes("/v1/store/languages")) {
      return jsonResponse([{ code: "en", name: "English" }]);
    }
    if (path.includes("/v1/private/category/unique")) {
      return jsonResponse({ exists: false });
    }
    if (path.includes("/v1/private/category") && init?.method === "POST") {
      return jsonResponse({ id: 22 });
    }
    if (path.includes("/v1/category")) {
      return jsonResponse({
        categories: [{ id: 1, code: "rootcat", children: [] }],
        recordsTotal: 1,
      });
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

function renderCreate() {
  return render(
    <I18nProvider defaultLang="en" langs={["en"]}>
      <CreateCategoryPage />
    </I18nProvider>,
  );
}

describe("create category", () => {
  beforeEach(() => {
    localStorage.clear();
    localStorage.setItem("token", "jwt");
    localStorage.setItem("merchant", "DEFAULT");
    localStorage.setItem("lang", "en");
    localStorage.setItem(
      "roles",
      JSON.stringify({
        canAccessToOrder: false,
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
    mockFetch();
  });

  afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
    localStorage.clear();
  });

  it("posts to /v1/private/category and returns to the list", async () => {
    renderCreate();

    await waitFor(() => {
      expect(screen.getByLabelText(/Code/)).toBeTruthy();
    });

    fireEvent.change(screen.getByLabelText(/Code/), {
      target: { value: "hats" },
    });
    fireEvent.change(screen.getByLabelText(/Name/), {
      target: { value: "Hats" },
    });

    await waitFor(() => {
      const save = screen.getByRole("button", { name: "Save" }) as HTMLButtonElement;
      expect(save.disabled).toBe(false);
    });

    fireEvent.click(screen.getByRole("button", { name: "Save" }));

    await waitFor(() => {
      expect(push).toHaveBeenCalledWith(
        "/pages/catalogue/categories/categories-list",
      );
    });

    const fetchMock = fetch as unknown as ReturnType<typeof vi.fn>;
    const create = fetchMock.mock.calls.find(
      (call) =>
        String(call[0]).includes("/v1/private/category") &&
        (call[1] as RequestInit | undefined)?.method === "POST",
    );
    expect(String(create?.[0])).toBe("/api/v1/private/category");
    const body = JSON.parse(String((create?.[1] as RequestInit).body));
    expect(body.code).toBe("hats");
    expect(body.parent).toEqual({ id: 0, code: "root" });
    expect(body.store).toBe("DEFAULT");
    expect(body.descriptions[0].name).toBe("Hats");
    expect(body.descriptions[0].friendlyUrl).toBe("hats");
  });
});
