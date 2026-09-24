import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { I18nProvider } from "@/components/i18n-provider";

import LoginPage from "./page";

const push = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push, replace: vi.fn() }),
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

function mockFetch() {
  const fetchMock = vi.fn(async (url: string) => {
    const path = String(url);
    if (path.includes("/v1/private/login")) {
      return {
        ok: true,
        status: 200,
        statusText: "OK",
        text: async () => JSON.stringify({ token: "jwt-token", id: 1 }),
      };
    }
    if (path.includes("/v1/private/user/profile")) {
      return {
        ok: true,
        status: 200,
        statusText: "OK",
        text: async () =>
          JSON.stringify({
            id: 1,
            active: true,
            defaultLanguage: "en",
            emailAddress: "admin@shopizer.com",
            firstName: "Admin",
            lastName: "User",
            groups: [{ name: "SUPERADMIN" }],
            lastAccess: "2026-01-01T00:00:00",
            loginTime: "2026-01-01T00:00:00",
            merchant: "DEFAULT",
            permissions: [],
            userName: "admin@shopizer.com",
          }),
      };
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

function renderLogin() {
  return render(
    <I18nProvider defaultLang="en" langs={["en", "fr"]}>
      <LoginPage />
    </I18nProvider>,
  );
}

describe("login page", () => {
  beforeEach(() => {
    localStorage.clear();
    push.mockReset();
    document.cookie = "token=; path=/; max-age=0";
    mockFetch();
  });

  afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
    localStorage.clear();
  });

  it("stores the token and navigates to /pages/home on success", async () => {
    renderLogin();

    fireEvent.change(screen.getByLabelText("Username"), {
      target: { value: "admin@shopizer.com" },
    });
    fireEvent.change(screen.getByLabelText("Password"), {
      target: { value: "password" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Login" }));

    await waitFor(() => {
      expect(localStorage.getItem("token")).toBe("jwt-token");
      expect(localStorage.getItem("userId")).toBe("1");
      expect(localStorage.getItem("merchant")).toBe("DEFAULT");
      expect(push).toHaveBeenCalledWith("/pages/home");
    });

    const roles = JSON.parse(localStorage.getItem("roles") ?? "{}");
    expect(roles.isSuperadmin).toBe(true);
    expect(roles.canAccessToOrder).toBe(true);
  });
});
