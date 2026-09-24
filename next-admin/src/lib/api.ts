import type { LoginRequest, LoginResponse, ShopizerUser } from "./types";

/**
 * Browser base path. Default `/shopizer-api` is rewritten to
 * `SHOPIZER_API_URL` (see `next.config.ts`) — same role as Angular
 * `proxy.conf.json`.
 */
export function apiBase(): string {
  return (process.env.NEXT_PUBLIC_API_BASE ?? "/shopizer-api").replace(/\/$/, "");
}

export class ShopizerApiError extends Error {
  status: number;

  constructor(status: number, message: string) {
    super(message);
    this.name = "ShopizerApiError";
    this.status = status;
  }
}

async function parseError(response: Response): Promise<ShopizerApiError> {
  if (response.status === 0) {
    return new ShopizerApiError(0, "Cannot reach the Shopizer API");
  }
  let message = "Invalid username or password";
  try {
    const body = (await response.json()) as { message?: string };
    if (body.message) {
      message = body.message;
    }
  } catch {
    /* keep default */
  }
  if (response.status >= 500) {
    message = "Cannot reach the Shopizer API";
  }
  return new ShopizerApiError(response.status, message);
}

export async function login(request: LoginRequest): Promise<LoginResponse> {
  const response = await fetch(`${apiBase()}/v1/private/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(request),
  });
  if (!response.ok) {
    throw await parseError(response);
  }
  return (await response.json()) as LoginResponse;
}

export async function getUserProfile(token: string): Promise<ShopizerUser> {
  const response = await fetch(`${apiBase()}/v1/private/user/profile`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!response.ok) {
    throw await parseError(response);
  }
  return (await response.json()) as ShopizerUser;
}
