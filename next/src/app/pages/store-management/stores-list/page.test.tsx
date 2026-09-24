import { cleanup, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { I18nProvider } from "@/components/i18n-provider";
import { EMPTY_ROLE_FLAGS } from "@/lib/auth/roles";

import StoresListPage from "./page";

const replace = vi.fn();
const push = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push, replace }),
}));

function renderList() {
  return render(
    <I18nProvider defaultLang="en" langs={["en", "fr"]}>
      <StoresListPage />
    </I18nProvider>,
  );
}

describe("stores list", () => {
  beforeEach(() => {
    process.env.SHOPIZER_API_URL = "http://localhost:8080/api";
    localStorage.clear();
    localStorage.setItem("token", "jwt");
    localStorage.setItem("merchant", "DEFAULT");
    localStorage.setItem(
      "roles",
      JSON.stringify({ ...EMPTY_ROLE_FLAGS, isAdmin: true, isSuperadmin: true }),
    );
    push.mockReset();
    replace.mockReset();
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => ({
        ok: true,
        status: 200,
        statusText: "OK",
        text: async () =>
          JSON.stringify({
            recordsTotal: 1,
            totalPages: 1,
            data: [
              {
                id: 1,
                code: "DEFAULT",
                name: "Default store",
                email: "admin@shopizer.com",
                retailer: true,
              },
            ],
          }),
      })),
    );
  });

  afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
    localStorage.clear();
  });

  it("lists stores with store/count/page for the session merchant", async () => {
    renderList();

    await waitFor(() => {
      expect(screen.getByText("Default store")).toBeTruthy();
    });

    const url = String((fetch as unknown as ReturnType<typeof vi.fn>).mock.calls[0][0]);
    expect(url).toContain("/v1/private/stores?");
    expect(url).toContain("store=DEFAULT");
    expect(url).toContain("count=10");
    expect(url).toContain("page=0");
  });
});
