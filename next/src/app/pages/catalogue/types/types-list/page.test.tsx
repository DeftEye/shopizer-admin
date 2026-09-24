import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { I18nProvider } from "@/components/i18n-provider";
import { EMPTY_ROLE_FLAGS } from "@/lib/auth/roles";

import TypesListPage from "./page";

const push = vi.fn();
const replace = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push, replace }),
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

function jsonResponse(body: unknown) {
  return {
    ok: true,
    status: 200,
    statusText: "OK",
    text: async () => JSON.stringify(body),
  };
}

describe("types list", () => {
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
    vi.stubGlobal(
      "fetch",
      vi.fn(async (url: string) => {
        const path = String(url);
        if (path.includes("/v1/private/products/types")) {
          return jsonResponse({
            recordsTotal: 1,
            list: [{ id: 4, store: "DEFAULT", code: "general" }],
          });
        }
        if (path.includes("/v1/private/products/type/4")) {
          return jsonResponse(null);
        }
        if (path.includes("/v1/private/stores")) {
          return jsonResponse({ data: [{ code: "DEFAULT" }] });
        }
        return jsonResponse({});
      }),
    );
  });

  afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
    localStorage.clear();
  });

  it("lists types and removes one", async () => {
    render(
      <I18nProvider defaultLang="en" langs={["en"]}>
        <TypesListPage />
      </I18nProvider>,
    );

    await waitFor(() => {
      expect(screen.getByText("general")).toBeTruthy();
    });

    fireEvent.click(screen.getByRole("button", { name: "Remove" }));
    fireEvent.click(screen.getByRole("button", { name: "Ok" }));

    await waitFor(() => {
      expect(screen.getByText("Option removed.")).toBeTruthy();
    });
  });
});
