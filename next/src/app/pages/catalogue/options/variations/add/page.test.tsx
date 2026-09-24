import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { I18nProvider } from "@/components/i18n-provider";

import AddVariationPage from "./page";

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
          { id: 2, code: "RED", descriptions: [{ language: "en", name: "Red" }] },
        ],
      });
    }
    if (path.includes("/v1/private/product/options")) {
      return jsonResponse({
        options: [
          { id: 1, code: "COLOR", descriptions: [{ language: "en", name: "Color" }] },
        ],
      });
    }
    if (path.includes("/v2/private/product/variation/unique")) {
      return jsonResponse({ exists: false });
    }
    if (path.endsWith("/v2/private/product/variation") && init?.method === "POST") {
      return jsonResponse({ id: 5 });
    }
    return jsonResponse({});
  });
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
}

describe("add variation", () => {
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

  it("posts to /v2/private/product/variation", async () => {
    const fetchMock = mockFetch();
    render(
      <I18nProvider defaultLang="en" langs={["en"]}>
        <AddVariationPage />
      </I18nProvider>,
    );

    fireEvent.change(await screen.findByLabelText(/Code/), {
      target: { value: "COLORRED" },
    });
    fireEvent.change(await screen.findByLabelText(/Option name/), {
      target: { value: "1" },
    });
    fireEvent.change(screen.getByLabelText("Option value"), {
      target: { value: "2" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Save" }));

    await waitFor(() => {
      const post = fetchMock.mock.calls.find(
        ([url, init]) =>
          String(url).endsWith("/v2/private/product/variation") &&
          (init as RequestInit).method === "POST",
      );
      expect(post).toBeTruthy();
      expect(JSON.parse(String((post?.[1] as RequestInit).body))).toEqual({
        code: "COLORRED",
        option: 1,
        optionValue: 2,
      });
    });
    expect(push).toHaveBeenCalledWith("/pages/catalogue/options/variations/list");
  });
});
