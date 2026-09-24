import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { I18nProvider } from "@/components/i18n-provider";

import CreateOptionPage from "./page";

const push = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push, replace: vi.fn() }),
}));

function jsonResponse(jsonBody: unknown, status = 200) {
  return {
    ok: status >= 200 && status < 300,
    status,
    statusText: "OK",
    text: async () => JSON.stringify(jsonBody),
  };
}

function mockFetch() {
  const fetchMock = vi.fn(async (url: string, init?: RequestInit) => {
    const path = String(url);
    if (path.includes("/v1/store/languages")) {
      return jsonResponse([
        { id: 1, code: "en", name: "English" },
        { id: 2, code: "fr", name: "French" },
      ]);
    }
    if (path.includes("/v1/private/product/option/unique")) {
      return jsonResponse({ exists: false });
    }
    if (path.endsWith("/v1/private/product/option") && init?.method === "POST") {
      return jsonResponse({ id: 11 });
    }
    return jsonResponse({}, 404);
  });
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
}

function renderPage() {
  return render(
    <I18nProvider defaultLang="en" langs={["en", "fr"]}>
      <CreateOptionPage />
    </I18nProvider>,
  );
}

describe("create option", () => {
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

  it("posts an option and returns to the list", async () => {
    const fetchMock = mockFetch();
    renderPage();

    const code = await screen.findByLabelText(/Code/);
    fireEvent.change(code, { target: { value: "SIZE" } });
    fireEvent.blur(code);
    fireEvent.change(screen.getByLabelText(/Name/), {
      target: { value: "Size" },
    });
    fireEvent.change(screen.getByLabelText(/Type/), {
      target: { value: "select" },
    });

    fireEvent.click(screen.getByRole("button", { name: "Save" }));

    await waitFor(() => {
      const post = fetchMock.mock.calls.find(
        ([url, init]) =>
          String(url).endsWith("/v1/private/product/option") &&
          (init as RequestInit).method === "POST",
      );
      expect(post).toBeTruthy();
      expect(JSON.parse(String((post?.[1] as RequestInit).body))).toEqual({
        code: "SIZE",
        type: "select",
        selectedLanguage: "en",
        descriptions: [
          { language: "en", name: "Size" },
          { language: "fr", name: "" },
        ],
      });
    });
    expect(push).toHaveBeenCalledWith("/pages/catalogue/options/options-list");
  });
});
