import type { LoginRequest, LoginResponse, ShopizerUser } from "./types";

/**
 * Browser base path. Default `/shopizer-api` is rewritten to
 * `SHOPIZER_API_URL` (see `next.config.ts`) — same role as Angular
 * `proxy.conf.json`.
 */
export function apiBase(): string {
  return (process.env.NEXT_PUBLIC_API_BASE ?? "/shopizer-api").replace(/\/$/, "");
}

/** Hung Shopizer hosts should not leave the login form on “Signing in…”. */
export const REQUEST_TIMEOUT_MS = 15_000;

export class ShopizerApiError extends Error {
  status: number;

  constructor(status: number, message: string) {
    super(message);
    this.name = "ShopizerApiError";
    this.status = status;
  }
}

export type ApiErrorKind = "login" | "profile";

export function defaultErrorMessage(status: number, kind: ApiErrorKind): string {
  if (status === 0 || status >= 500) {
    return "Cannot reach the Shopizer API";
  }
  if (kind === "login") {
    return "Invalid username or password";
  }
  if (status === 401) {
    return "Session expired. Please sign in again.";
  }
  return "Could not load the user profile";
}

function isAbortError(error: unknown): boolean {
  return error instanceof Error && (error.name === "AbortError" || error.name === "TimeoutError");
}

async function shopizerFetch(url: string, init: RequestInit): Promise<Response> {
  try {
    return await fetch(url, {
      ...init,
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    });
  } catch (error) {
    if (isAbortError(error)) {
      throw new ShopizerApiError(0, "Shopizer API timed out");
    }
    throw new ShopizerApiError(0, "Cannot reach the Shopizer API");
  }
}

async function parseError(
  response: Response,
  kind: ApiErrorKind,
): Promise<ShopizerApiError> {
  let message = defaultErrorMessage(response.status, kind);
  try {
    const body = (await response.json()) as { message?: string };
    if (body.message) {
      message = body.message;
    }
  } catch {
    /* keep status-specific default */
  }
  if (response.status >= 500) {
    message = defaultErrorMessage(response.status, kind);
  }
  return new ShopizerApiError(response.status, message);
}

export async function login(request: LoginRequest): Promise<LoginResponse> {
  const response = await shopizerFetch(`${apiBase()}/v1/private/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(request),
  });
  if (!response.ok) {
    throw await parseError(response, "login");
  }
  return (await response.json()) as LoginResponse;
}

export async function getUserProfile(token: string): Promise<ShopizerUser> {
  const response = await shopizerFetch(`${apiBase()}/v1/private/user/profile`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!response.ok) {
    throw await parseError(response, "profile");
  }
  return (await response.json()) as ShopizerUser;
}
