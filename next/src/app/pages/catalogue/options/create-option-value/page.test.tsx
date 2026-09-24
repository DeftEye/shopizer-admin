import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { I18nProvider } from "@/components/i18n-provider";

import CreateOptionValuePage from "./page";

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
    if (path.includes("/v1/languages")) {
      return jsonResponse([{ id: 1, code: "en", name: "English" }]);
    }
    if (path.includes("/option/value/unique")) {
      return jsonResponse({ exists: false });
    }
    if (path.endsWith("/v1/private/product/option/value") && init?.method === "POST") {
      return jsonResponse({ id: 21 });
    }
    if (path.endsWith("/v1/private/product/option/value/21/image")) {
      return jsonResponse({});
    }
    return jsonResponse({}, 404);
  });
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
}

describe("create option value", () => {
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

  it("creates a value and uploads the image as FormData", async () => {
    const fetchMock = mockFetch();
    render(
      <I18nProvider defaultLang="en" langs={["en"]}>
        <CreateOptionValuePage />
      </I18nProvider>,
    );

    const code = await screen.findByLabelText("Code");
    fireEvent.change(code, { target: { value: "RED" } });
    fireEvent.blur(code);
    fireEvent.change(screen.getByLabelText(/Name/), {
      target: { value: "Red" },
    });

    const file = new File(["img"], "red.png", { type: "image/png" });
    fireEvent.change(document.getElementById("option-value-image") as HTMLInputElement, {
      target: { files: [file] },
    });

    fireEvent.click(screen.getByRole("button", { name: "Save" }));

    await waitFor(() => {
      const create = fetchMock.mock.calls.find(
        ([url, init]) =>
          String(url).endsWith("/v1/private/product/option/value") &&
          (init as RequestInit).method === "POST",
      );
      expect(create).toBeTruthy();
      expect(JSON.parse(String((create?.[1] as RequestInit).body))).toEqual({
        code: "RED",
        selectedLanguage: "en",
        descriptions: [{ language: "en", name: "Red" }],
      });
      const image = fetchMock.mock.calls.find(([url]) =>
        String(url).endsWith("/v1/private/product/option/value/21/image"),
      );
      expect(image).toBeTruthy();
      expect((image?.[1] as RequestInit).body).toBeInstanceOf(FormData);
    });
    expect(push).toHaveBeenCalledWith(
      "/pages/catalogue/options/options-values-list",
    );
  });
});
