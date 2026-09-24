import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { I18nProvider } from "@/components/i18n-provider";

import { DiscountForm } from "./discount-form";

describe("discount form", () => {
  afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
  });

  it("does not call the API on save (Angular save is empty)", () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);

    render(
      <I18nProvider defaultLang="en" langs={["en"]}>
        <DiscountForm />
      </I18nProvider>,
    );

    fireEvent.click(screen.getByLabelText(/Discounted price/i));
    fireEvent.click(screen.getByRole("button", { name: "Save" }));
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
