import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { I18nProvider } from "@/components/i18n-provider";

import { StoreAutocomplete } from "./store-autocomplete";

function renderAuto(onStore = vi.fn()) {
  return {
    onStore,
    ...render(
      <I18nProvider defaultLang="en" langs={["en", "fr"]}>
        <StoreAutocomplete onStore={onStore} />
      </I18nProvider>,
    ),
  };
}

describe("store autocomplete", () => {
  beforeEach(() => {
    process.env.SHOPIZER_API_URL = "http://localhost:8080/api";
    localStorage.clear();
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => ({
        ok: true,
        status: 200,
        statusText: "OK",
        text: async () =>
          JSON.stringify({
            data: [
              { code: "DEFAULT", name: "Default store" },
              { code: "SHOP", name: "Shop" },
            ],
          }),
      })),
    );
  });

  afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
  });

  it("loads store names and emits the selected code", async () => {
    const { onStore } = renderAuto();

    fireEvent.focus(screen.getByLabelText("Merchant store"));

    await waitFor(() => {
      expect(screen.getByText("DEFAULT — Default store")).toBeTruthy();
    });

    fireEvent.mouseDown(screen.getByText("SHOP — Shop"));
    expect(onStore).toHaveBeenCalledWith("SHOP");
    expect(String((fetch as unknown as ReturnType<typeof vi.fn>).mock.calls[0][0])).toContain(
      "/v1/private/stores/names",
    );
  });
});
