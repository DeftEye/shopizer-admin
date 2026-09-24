import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { I18nProvider } from "@/components/i18n-provider";

import CreateOptionSetPage from "./page";

const push = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push, replace: vi.fn() }),
}));

function jsonResponse(jsonBody: unknown) {
  return {
    ok: true,
    status: 200,
    statusText: "OK",
    text: async () => JSON.stringify(jsonBody),
  };
}

function mockFetch() {
  const fetchMock = vi.fn(async (url: string, init?: RequestInit) => {
    const path = String(url);
    if (path.includes("/v1/private/product/options/values")) {
      return jsonResponse({
        optionValues: [
          { id: 2, code: "S", descriptions: [{ language: "en", name: "Small" }] },
          { id: 3, code: "M", descriptions: [{ language: "en", name: "Medium" }] },
        ],
      });
    }
    if (path.includes("/v1/private/product/options")) {
      return jsonResponse({
        options: [
          { id: 1, code: "SIZE", descriptions: [{ language: "en", name: "Size" }] },
        ],
      });
    }
    if (path.includes("/v1/private/products/types")) {
      return jsonResponse({ list: [{ id: 4, code: "GENERAL" }] });
    }
    if (path.includes("/property/set/unique")) {
      return jsonResponse({ exists: false });
    }
    if (path.includes("/v1/private/product/property/set") && init?.method === "POST") {
      return jsonResponse({ id: 8 });
    }
    return jsonResponse({});
  });
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
}

describe("create option set", () => {
  beforeEach(() => {
    localStorage.clear();
    localStorage.setItem("merchant", "DEFAULT");
    localStorage.setItem("lang", "en");
    localStorage.setItem("token", "jwt");
    process.env.SHOPIZER_API_URL = "http://localhost:8080/api";
    push.mockReset();
  });

  afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
    localStorage.clear();
  });

  it("posts option, values, and product type ids", async () => {
    const fetchMock = mockFetch();
    render(
      <I18nProvider defaultLang="en" langs={["en"]}>
        <CreateOptionSetPage />
      </I18nProvider>,
    );

    fireEvent.change(await screen.findByLabelText(/Code/), {
      target: { value: "SIZESET" },
    });
    fireEvent.change(await screen.findByLabelText(/Option name/), {
      target: { value: "1" },
    });
    fireEvent.change(screen.getByLabelText("Option value"), {
      target: {
        value: "2",
        selectedOptions: [{ value: "2" }, { value: "3" }],
      },
    });
    const values = screen.getByLabelText("Option value") as HTMLSelectElement;
    Array.from(values.options).forEach((option) => {
      option.selected = option.value === "2" || option.value === "3";
    });
    fireEvent.change(values);
    const types = screen.getByLabelText("Product type") as HTMLSelectElement;
    Array.from(types.options).forEach((option) => {
      option.selected = option.value === "4";
    });
    fireEvent.change(types);

    fireEvent.click(screen.getByRole("button", { name: "Save" }));

    await waitFor(() => {
      const post = fetchMock.mock.calls.find(
        ([url, init]) =>
          String(url).includes("/v1/private/product/property/set") &&
          (init as RequestInit).method === "POST",
      );
      expect(post).toBeTruthy();
      expect(JSON.parse(String((post?.[1] as RequestInit).body))).toEqual({
        readOnly: false,
        code: "SIZESET",
        option: 1,
        optionValues: [2, 3],
        productTypes: [4],
      });
    });
    expect(push).toHaveBeenCalledWith(
      "/pages/catalogue/options/options-set-list",
    );
  });
});
