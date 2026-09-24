import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { I18nProvider } from "@/components/i18n-provider";

import CreateProductPage from "./page";

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
    if (path.includes("/v1/manufacturers")) {
      return jsonResponse({ manufacturers: [{ code: "testbrand" }] });
    }
    if (path.includes("/v1/private/product/types")) {
      return jsonResponse({ list: [{ code: "GENERAL" }] });
    }
    if (path.includes("/v1/store/languages")) {
      return jsonResponse([{ code: "en", name: "English" }]);
    }
    if (path.includes("/v1/private/product/unique")) {
      return jsonResponse({ exists: false });
    }
    if (
      path.includes("/v2/private/product/definition") &&
      init?.method === "POST"
    ) {
      return jsonResponse({ id: 22 });
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
      <CreateProductPage />
    </I18nProvider>,
  );
}

describe("create product", () => {
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

  it("posts a definition to /v2/private/product/definition?store=", async () => {
    renderCreate();

    await waitFor(() => {
      expect(screen.getByLabelText(/Unique identifier/)).toBeTruthy();
    });

    fireEvent.change(screen.getByLabelText(/Unique identifier/), {
      target: { value: "SKU1" },
    });
    await waitFor(() => {
      const save = screen.getByRole("button", {
        name: "Save Product definition",
      }) as HTMLButtonElement;
      expect(save.disabled).toBe(false);
    });
    fireEvent.change(screen.getByLabelText(/^Order$/), {
      target: { value: "0" },
    });
    fireEvent.change(screen.getByLabelText(/Manufacturer/), {
      target: { value: "testbrand" },
    });
    fireEvent.change(screen.getByLabelText(/Name - English/), {
      target: { value: "Hat" },
    });
    fireEvent.change(screen.getByLabelText(/Final price/), {
      target: { value: "9.99" },
    });
    fireEvent.change(screen.getByLabelText(/Quantity/), {
      target: { value: "2" },
    });

    fireEvent.click(
      screen.getByRole("button", { name: "Save Product definition" }),
    );

    await waitFor(() => {
      expect(push).toHaveBeenCalledWith(
        "/pages/catalogue/products/products-list",
      );
    });

    const fetchMock = fetch as unknown as ReturnType<typeof vi.fn>;
    const create = fetchMock.mock.calls.find((call) =>
      String(call[0]).includes("/v2/private/product/definition"),
    );
    expect(String(create?.[0])).toBe(
      "/api/v2/private/product/definition?store=DEFAULT",
    );
    expect((create?.[1] as RequestInit).method).toBe("POST");
    const body = JSON.parse(String((create?.[1] as RequestInit).body));
    expect(body.sku).toBe("SKU1");
    expect(body.manufacturer).toBe("testbrand");
    expect(body.descriptions[0].name).toBe("Hat");
    expect(body.descriptions[0].friendlyUrl).toBe("hat");
    expect(body).not.toHaveProperty("selectedLanguage");
  });
});
