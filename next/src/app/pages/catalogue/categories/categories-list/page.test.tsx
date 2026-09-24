import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { I18nProvider } from "@/components/i18n-provider";

import CategoriesListPage from "./page";

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
    if (path.includes("/v1/private/category/4/visible") && init?.method === "PATCH") {
      return jsonResponse({});
    }
    if (path.includes("/v1/private/category/4") && init?.method === "DELETE") {
      return jsonResponse({});
    }
    if (path.includes("/v1/category")) {
      return jsonResponse({
        recordsTotal: 2,
        categories: [
          {
            id: 4,
            code: "rootcat",
            store: "DEFAULT",
            visible: true,
            description: { name: "Root cat" },
            children: [
              {
                id: 5,
                code: "child",
                store: "DEFAULT",
                visible: false,
                parent: { id: 4, code: "rootcat" },
                description: { name: "Child" },
                children: [],
              },
            ],
          },
        ],
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

function renderList() {
  return render(
    <I18nProvider defaultLang="en" langs={["en"]}>
      <CategoriesListPage />
    </I18nProvider>,
  );
}

describe("categories list", () => {
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

  it("loads /v1/category with store, lang, count, and 0-based page", async () => {
    renderList();

    await waitFor(() => {
      expect(screen.getByText("rootcat")).toBeTruthy();
      expect(screen.getByText("Child")).toBeTruthy();
    });

    const fetchMock = fetch as unknown as ReturnType<typeof vi.fn>;
    const listUrl = fetchMock.mock.calls
      .map((call) => String(call[0]))
      .find((url) => url.includes("/v1/category"));
    expect(listUrl).toBeTruthy();
    const params = new URL(listUrl as string, "http://local.invalid").searchParams;
    expect(params.get("store")).toBe("DEFAULT");
    expect(params.get("lang")).toBe("en");
    expect(params.get("count")).toBe("25");
    expect(params.get("page")).toBe("0");
  });

  it("patches visibility and deletes through the Angular v1 paths", async () => {
    const confirm = vi.spyOn(window, "confirm").mockReturnValue(true);
    renderList();
    await waitFor(() => expect(screen.getByText("rootcat")).toBeTruthy());

    fireEvent.click(screen.getByLabelText("Visible rootcat"));
    await waitFor(() => {
      expect(screen.getByText("Category visibility updated")).toBeTruthy();
    });

    fireEvent.click(screen.getAllByRole("button", { name: "Remove" })[0]);
    await waitFor(() => {
      expect(screen.getByText("Category removed.")).toBeTruthy();
    });

    const fetchMock = fetch as unknown as ReturnType<typeof vi.fn>;
    const patch = fetchMock.mock.calls.find(
      (call) => (call[1] as RequestInit | undefined)?.method === "PATCH",
    );
    const del = fetchMock.mock.calls.find(
      (call) => (call[1] as RequestInit | undefined)?.method === "DELETE",
    );
    expect(String(patch?.[0])).toContain("/v1/private/category/4/visible");
    expect(JSON.parse(String(patch?.[1]?.body)).visible).toBe(false);
    expect(String(del?.[0])).toContain("/v1/private/category/4");
    expect(confirm).toHaveBeenCalled();
  });
});
