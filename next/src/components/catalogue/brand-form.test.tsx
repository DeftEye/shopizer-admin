import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { I18nProvider } from "@/components/i18n-provider";
import { EMPTY_ROLE_FLAGS } from "@/lib/auth/roles";

import { BrandForm } from "./brand-form";

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
    if (path.includes("/v1/private/manufacturer/unique")) {
      return jsonResponse({ exists });
    }
    if (path.includes("/v1/private/manufacturer") && init?.method === "POST") {
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
      <BrandForm titleKey="COMPONENTS.CREATE_BRAND" />
    </I18nProvider>,
  );
}

describe("brand form", () => {
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

  it("creates a brand and returns to the list", async () => {
    const fetchMock = mockFetch(false);
    renderForm();

    await waitFor(() => {
      expect(screen.getByLabelText("Code")).toBeTruthy();
    });

    fireEvent.change(screen.getByLabelText("Code"), {
      target: { value: "nike" },
    });
    fireEvent.change(screen.getByLabelText("Order"), {
      target: { value: "1" },
    });
    fireEvent.change(screen.getByLabelText("Name"), {
      target: { value: "Nike" },
    });

    await waitFor(() => {
      expect((screen.getByLabelText("Search engine friendly url") as HTMLInputElement).value).toBe(
        "nike",
      );
    });

    fireEvent.click(screen.getByRole("button", { name: "Save" }));

    await waitFor(() => {
      expect(push).toHaveBeenCalledWith("/pages/catalogue/brands/brands-list");
    });

    const create = fetchMock.mock.calls.find(
      (call) =>
        String(call[0]).endsWith("/v1/private/manufacturer") &&
        (call[1] as RequestInit).method === "POST",
    );
    expect(create).toBeTruthy();
    const body = JSON.parse(String((create?.[1] as RequestInit).body));
    expect(body.code).toBe("nike");
    expect(body.descriptions[0].name).toBe("Nike");
    expect(body.descriptions[1].name).toBe("Nike");
  });

  it("blocks save when the manufacturer code already exists", async () => {
    mockFetch(true);
    renderForm();

    await waitFor(() => {
      expect(screen.getByLabelText("Code")).toBeTruthy();
    });

    fireEvent.change(screen.getByLabelText("Code"), {
      target: { value: "nike" },
    });
    fireEvent.change(screen.getByLabelText("Order"), {
      target: { value: "1" },
    });
    fireEvent.change(screen.getByLabelText("Name"), {
      target: { value: "Nike" },
    });

    await waitFor(() => {
      expect(screen.getByText("This code already exists.")).toBeTruthy();
    });

    fireEvent.click(screen.getByRole("button", { name: "Save" }));

    await waitFor(() => {
      expect(screen.getAllByText("This code already exists.").length).toBeGreaterThan(0);
    });
    expect(push).not.toHaveBeenCalled();
  });
});
