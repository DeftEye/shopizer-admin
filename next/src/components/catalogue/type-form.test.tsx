import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { I18nProvider } from "@/components/i18n-provider";
import { EMPTY_ROLE_FLAGS } from "@/lib/auth/roles";

import { TypeForm } from "./type-form";

const push = vi.fn();
const replace = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push, replace }),
}));

function jsonResponse(body: unknown) {
  return {
    ok: true,
    status: 200,
    statusText: "OK",
    text: async () => JSON.stringify(body),
  };
}

function mockFetch(exists = false) {
  const fetchMock = vi.fn(async (url: string, init?: RequestInit) => {
    const path = String(url);
    if (path.includes("/v1/store/languages")) {
      return jsonResponse([{ code: "en" }, { code: "fr" }]);
    }
    if (path.includes("/v1/private/products/type/unique")) {
      return jsonResponse({ exists });
    }
    if (
      path.includes("/v1/private/products/type") &&
      init?.method === "POST"
    ) {
      return jsonResponse({});
    }
    return jsonResponse({});
  });
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
}

function renderForm() {
  return render(
    <I18nProvider defaultLang="en" langs={["en", "fr"]}>
      <TypeForm />
    </I18nProvider>,
  );
}

describe("type form", () => {
  beforeEach(() => {
    localStorage.clear();
    localStorage.setItem("token", "jwt");
    localStorage.setItem("merchant", "DEFAULT");
    localStorage.setItem("lang", "en");
    localStorage.setItem(
      "roles",
      JSON.stringify({ ...EMPTY_ROLE_FLAGS, isAdmin: true }),
    );
    push.mockReset();
    replace.mockReset();
  });

  afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
    localStorage.clear();
  });

  it("copies the visible name into empty locales on save", async () => {
    const fetchMock = mockFetch(false);
    renderForm();

    await waitFor(() => {
      expect(screen.getByLabelText("Code *")).toBeTruthy();
    });

    const codeInput = screen.getByLabelText("Code *");
    fireEvent.change(codeInput, { target: { value: "general" } });
    fireEvent.blur(codeInput);
    fireEvent.change(screen.getByLabelText("Name*"), {
      target: { value: "General" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Save" }));

    await waitFor(() => {
      expect(push).toHaveBeenCalledWith("/pages/catalogue/types/types-list");
    });

    const create = fetchMock.mock.calls.find(
      (call) =>
        String(call[0]).includes("/v1/private/products/type") &&
        (call[1] as RequestInit).method === "POST",
    );
    const body = JSON.parse(String((create?.[1] as RequestInit).body));
    expect(body.descriptions).toEqual([
      { language: "en", name: "General" },
      { language: "fr", name: "General" },
    ]);
  });

  it("shows a required-fields error instead of a silent no-op when every name is empty", async () => {
    mockFetch(false);
    renderForm();

    await waitFor(() => {
      expect(screen.getByLabelText("Code *")).toBeTruthy();
    });

    fireEvent.change(screen.getByLabelText("Code *"), {
      target: { value: "general" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Save" }));

    await waitFor(() => {
      expect(screen.getByText("Please, fill required fields.")).toBeTruthy();
    });
    expect(push).not.toHaveBeenCalled();
  });

  it("does not show a code collision when editing an existing type", async () => {
    const fetchMock = vi.fn(async (url: string, init?: RequestInit) => {
      const path = String(url);
      if (path.includes("/v1/store/languages")) {
        return jsonResponse([{ code: "en" }, { code: "fr" }]);
      }
      if (path.includes("/v1/private/products/type/unique")) {
        return jsonResponse({ exists: true });
      }
      if (path.includes("/v1/private/products/type/4") && init?.method === "PUT") {
        return jsonResponse({});
      }
      if (path.includes("/v1/private/products/type/4")) {
        return jsonResponse({
          id: 4,
          code: "general",
          allowAddToCart: true,
          visible: true,
          descriptions: [{ language: "en", name: "General" }],
        });
      }
      return jsonResponse({});
    });
    vi.stubGlobal("fetch", fetchMock);

    render(
      <I18nProvider defaultLang="en" langs={["en", "fr"]}>
        <TypeForm typeId="4" />
      </I18nProvider>,
    );

    await waitFor(() => {
      expect((screen.getByLabelText("Code *") as HTMLInputElement).value).toBe(
        "general",
      );
    });

    fireEvent.blur(screen.getByLabelText("Code *"));
    fireEvent.click(screen.getByRole("button", { name: "Save" }));

    await waitFor(() => {
      expect(screen.getByText("Product type updated")).toBeTruthy();
    });
    expect(screen.queryByText("This code already exists.")).toBeNull();
    expect(
      fetchMock.mock.calls.some((call) =>
        String(call[0]).includes("/v1/private/products/type/unique"),
      ),
    ).toBe(false);
  });

  it("does not fire a second create when Save is clicked twice", async () => {
    let releaseCreate: ((value: unknown) => void) | undefined;
    const createGate = new Promise((resolve) => {
      releaseCreate = resolve;
    });
    const fetchMock = vi.fn(async (url: string, init?: RequestInit) => {
      const path = String(url);
      if (path.includes("/v1/store/languages")) {
        return jsonResponse([{ code: "en" }, { code: "fr" }]);
      }
      if (path.includes("/v1/private/products/type/unique")) {
        return jsonResponse({ exists: false });
      }
      if (path.includes("/v1/private/products/type") && init?.method === "POST") {
        await createGate;
        return jsonResponse({});
      }
      return jsonResponse({});
    });
    vi.stubGlobal("fetch", fetchMock);
    renderForm();

    await waitFor(() => {
      expect(screen.getByLabelText("Code *")).toBeTruthy();
    });

    fireEvent.change(screen.getByLabelText("Code *"), {
      target: { value: "general" },
    });
    fireEvent.change(screen.getByLabelText("Name*"), {
      target: { value: "General" },
    });

    const save = screen.getByRole("button", { name: "Save" });
    fireEvent.click(save);
    fireEvent.click(save);
    releaseCreate?.({});

    await waitFor(() => {
      expect(push).toHaveBeenCalledWith("/pages/catalogue/types/types-list");
    });
    expect(
      fetchMock.mock.calls.filter(
        (call) =>
          String(call[0]).includes("/v1/private/products/type") &&
          (call[1] as RequestInit).method === "POST",
      ),
    ).toHaveLength(1);
  });
});
