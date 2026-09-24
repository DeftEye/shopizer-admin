import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { I18nProvider } from "@/components/i18n-provider";

import CategoriesHierarchyPage from "./page";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn() }),
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
    if (path.includes("/move/") && init?.method === "PUT") {
      return jsonResponse({});
    }
    if (path.includes("/v1/category")) {
      return jsonResponse({
        categories: [
          {
            id: 4,
            code: "rootcat",
            description: { name: "Root cat" },
            children: [
              {
                id: 5,
                code: "child",
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

describe("categories hierarchy", () => {
  beforeEach(() => {
    localStorage.clear();
    localStorage.setItem("token", "jwt");
    localStorage.setItem("merchant", "DEFAULT");
    localStorage.setItem("lang", "en");
    mockFetch();
  });

  afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
    localStorage.clear();
  });

  it("loads the tree without a count and moves a node to root with parentId -1", async () => {
    render(
      <I18nProvider defaultLang="en" langs={["en"]}>
        <CategoriesHierarchyPage />
      </I18nProvider>,
    );

    await waitFor(() => {
      expect(screen.getByText("Root cat")).toBeTruthy();
      expect(screen.getByText("Child")).toBeTruthy();
    });

    const fetchMock = fetch as unknown as ReturnType<typeof vi.fn>;
    const listUrl = fetchMock.mock.calls
      .map((call) => String(call[0]))
      .find((url) => url.includes("/v1/category"));
    const params = new URL(listUrl as string, "http://local.invalid").searchParams;
    expect(params.get("count")).toBeNull();
    expect(params.get("page")).toBe("0");

    const child = screen.getByText("Child");
    fireEvent.drop(screen.getByText("root"), {
      dataTransfer: {
        getData: () => "5",
      },
    });
    await waitFor(() => {
      expect(screen.getByText("Hierarchy successfully updated")).toBeTruthy();
    });

    const move = fetchMock.mock.calls.find((call) =>
      String(call[0]).includes("/move/"),
    );
    expect(String(move?.[0])).toContain("/v1/private/category/5/move/-1");
    expect((move?.[1] as RequestInit).method).toBe("PUT");
    expect(child).toBeTruthy();
  });

  it("does not PUT a cycle when an ancestor is dropped onto a descendant", async () => {
    render(
      <I18nProvider defaultLang="en" langs={["en"]}>
        <CategoriesHierarchyPage />
      </I18nProvider>,
    );

    await waitFor(() => {
      expect(screen.getByText("Child")).toBeTruthy();
    });

    const fetchMock = fetch as unknown as ReturnType<typeof vi.fn>;
    fetchMock.mockClear();

    fireEvent.drop(screen.getByText("Child"), {
      dataTransfer: {
        getData: () => "4",
      },
    });

    await waitFor(() => {
      expect(
        fetchMock.mock.calls.some((call) => String(call[0]).includes("/move/")),
      ).toBe(false);
      expect(screen.queryByText("Hierarchy successfully updated")).toBeNull();
    });
  });
});
