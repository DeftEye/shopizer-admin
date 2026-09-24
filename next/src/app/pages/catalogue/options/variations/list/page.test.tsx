import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { I18nProvider } from "@/components/i18n-provider";

import VariationsListPage from "./page";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn() }),
}));

vi.mock("next/link", () => ({
  default: ({
    href,
    children,
    ...props
  }: {
    href: string;
    children: React.ReactNode;
  }) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

describe("variations list", () => {
  beforeEach(() => {
    localStorage.clear();
    localStorage.setItem("token", "jwt");
    process.env.SHOPIZER_API_URL = "http://localhost:8080/api";
    vi.stubGlobal(
      "fetch",
      vi.fn(async (url: string) => {
        if (String(url).includes("/v2/private/product/variation")) {
          return {
            ok: true,
            status: 200,
            statusText: "OK",
            text: async () =>
              JSON.stringify({
                items: [
                  {
                    id: 9,
                    code: "COLORRED",
                    option: { id: 1, name: "Color" },
                    values: [{ id: 2, name: "Red" }],
                  },
                ],
              }),
          };
        }
        return {
          ok: false,
          status: 404,
          statusText: "Not Found",
          text: async () => "",
        };
      }),
    );
  });

  afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
    localStorage.clear();
  });

  it("renders /v2 variation items", async () => {
    render(
      <I18nProvider defaultLang="en" langs={["en"]}>
        <VariationsListPage />
      </I18nProvider>,
    );

    expect(await screen.findByText("COLORRED")).toBeTruthy();
    expect(screen.getByText("Color")).toBeTruthy();
    expect(screen.getByText("Red")).toBeTruthy();
    expect(screen.getByRole("link", { name: "Add Variation" })).toHaveProperty(
      "href",
      expect.stringContaining("/pages/catalogue/options/variations/add"),
    );
  });
});
