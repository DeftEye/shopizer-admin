import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { I18nProvider } from "@/components/i18n-provider";
import { EMPTY_ROLE_FLAGS } from "@/lib/auth/roles";

import CreateStorePage from "./page";

const push = vi.fn();
const replace = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push, replace }),
}));

function renderCreate() {
  return render(
    <I18nProvider defaultLang="en" langs={["en", "fr"]}>
      <CreateStorePage />
    </I18nProvider>,
  );
}

describe("create store", () => {
  beforeEach(() => {
    process.env.SHOPIZER_API_URL = "http://localhost:8080/api";
    process.env.NEXT_PUBLIC_LANGS = "en,fr";
    localStorage.clear();
    localStorage.setItem("token", "jwt");
    localStorage.setItem("merchant", "DEFAULT");
    localStorage.setItem(
      "roles",
      JSON.stringify({ ...EMPTY_ROLE_FLAGS, isSuperadmin: true }),
    );
    push.mockReset();
    replace.mockReset();

    vi.stubGlobal(
      "fetch",
      vi.fn(async (url: string) => {
        const path = String(url);
        let body: unknown = {};
        if (path.includes("/v1/country")) {
          body = [{ id: 1, code: "CA", name: "Canada", zones: [] }];
        } else if (path.includes("/v1/currency")) {
          body = [{ code: "CAD" }];
        } else if (path.includes("/v1/measures")) {
          body = { weights: ["KG"], measures: ["CM"] };
        } else if (path.includes("/v1/private/stores")) {
          body = {
            data: [
              {
                id: 1,
                code: "DEFAULT",
                name: "Default",
                retailer: true,
                defaultLanguage: "en",
                currency: "CAD",
                currencyFormatNational: true,
                weight: "KG",
                dimension: "CM",
                supportedLanguages: [{ id: 1, code: "en", name: "English" }],
                address: {
                  address: "1 Main",
                  city: "Montreal",
                  postalCode: "H1A1A1",
                  stateProvince: "QC",
                  country: "CA",
                },
              },
            ],
            recordsTotal: 1,
          };
        } else if (path.includes("/v1/zones")) {
          body = [{ code: "QC", name: "Quebec" }];
        } else if (path.includes("/v1/private/store/unique")) {
          body = { exists: false };
        }
        return {
          ok: true,
          status: 200,
          statusText: "OK",
          text: async () => JSON.stringify(body),
        };
      }),
    );
  });

  afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
    localStorage.clear();
  });

  it("checks uniqueness then POSTs /v1/private/store", async () => {
    renderCreate();

    await waitFor(() => {
      expect(document.getElementById("store-name")).toBeTruthy();
    });

    const retailer = document.getElementById("store-is-retailer") as HTMLInputElement;
    expect(retailer.checked).toBe(false);

    const set = (id: string, value: string) => {
      fireEvent.change(document.getElementById(id) as HTMLElement, {
        target: { value },
      });
    };

    set("store-name", "New shop");
    set("store-code", "NEWSHOP");
    set("store-phone", "555-0100");
    set("store-email", "shop@example.com");
    set("store-address", "2 King");
    set("store-city", "Toronto");
    set("store-postal", "M5V1A1");
    set("store-country", "CA");
    set("store-default-lang", "en");
    set("store-currency", "CAD");
    set("store-weight", "KG");
    set("store-size", "CM");

    const save = screen.getByRole("button", { name: "Save" }) as HTMLButtonElement;
    expect(save.disabled).toBe(false);
    fireEvent.click(save);

    await waitFor(() => {
      const calls = (fetch as unknown as ReturnType<typeof vi.fn>).mock.calls;
      const unique = calls.find((call) => String(call[0]).includes("/v1/private/store/unique"));
      const create = calls.find(
        (call) =>
          String(call[0]).endsWith("/v1/private/store") &&
          (call[1] as RequestInit).method === "POST",
      );
      expect(unique).toBeTruthy();
      expect(create).toBeTruthy();
      const body = JSON.parse(String((create?.[1] as RequestInit).body));
      expect(body.retailer).toBe(false);
      expect(push).toHaveBeenCalledWith("/pages/store-management/stores-list");
    });
  });
});
