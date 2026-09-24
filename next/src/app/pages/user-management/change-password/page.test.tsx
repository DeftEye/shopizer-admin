import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { I18nProvider } from "@/components/i18n-provider";

import ChangePasswordPage from "./page";

const push = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push, replace: vi.fn() }),
}));

function mockFetch() {
  const fetchMock = vi.fn(async (url: string, init?: RequestInit) => {
    const path = String(url);
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
            lastAccess: "",
            loginTime: "",
            merchant: "DEFAULT",
            permissions: [],
            userName: "admin@shopizer.com",
          }),
      };
    }
    if (path.includes("/password") && init?.method === "PATCH") {
      return {
        ok: true,
        status: 200,
        statusText: "OK",
        text: async () => "",
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

function renderPage() {
  return render(
    <I18nProvider defaultLang="en" langs={["en", "fr"]}>
      <ChangePasswordPage />
    </I18nProvider>,
  );
}

describe("change password page", () => {
  beforeEach(() => {
    localStorage.clear();
    localStorage.setItem("userId", "1");
    localStorage.setItem("token", "jwt");
    push.mockReset();
    mockFetch();
  });

  afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
    localStorage.clear();
  });

  it("PATCHes /v1/private/user/{id}/password with Angular's body", async () => {
    const fetchMock = mockFetch();
    renderPage();

    await waitFor(() => {
      expect(screen.getByText(/admin@shopizer.com/)).toBeTruthy();
    });

    fireEvent.change(screen.getByLabelText("Current password"), {
      target: { value: "password" },
    });
    fireEvent.change(screen.getByLabelText("New password"), {
      target: { value: "Passw0rd" },
    });
    fireEvent.change(screen.getByLabelText("Repeat new password"), {
      target: { value: "Passw0rd" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Save" }));

    await waitFor(() => {
      const patch = fetchMock.mock.calls.find(
        (call) =>
          String(call[0]).includes("/v1/private/user/1/password") &&
          (call[1] as RequestInit).method === "PATCH",
      );
      expect(patch).toBeTruthy();
      expect((patch?.[1] as RequestInit).body).toBe(
        JSON.stringify({ password: "password", changePassword: "Passw0rd" }),
      );
    });
    expect(await screen.findByText("Password successfully changed")).toBeTruthy();
  });
});
