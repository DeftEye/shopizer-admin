import { getToken } from "./auth";
import type { LoginResponse, OrdersResponse, UserProfile } from "./types";

/**
 * Browser calls same-origin /shopizer-api, rewritten by next.config.ts
 * to SHOPIZER_API_URL (default http://localhost:8080/api).
 */
export function apiBase(): string {
  if (typeof window !== "undefined") {
    return "/shopizer-api";
  }
  return (process.env.SHOPIZER_API_URL || "http://localhost:8080/api").replace(
    /\/$/,
    "",
  );
}

export class ApiError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

async function request<T>(
  path: string,
  init: RequestInit = {},
  opts: { auth?: boolean } = { auth: true },
): Promise<T> {
  const headers = new Headers(init.headers);
  if (!headers.has("Accept")) {
    headers.set("Accept", "application/json");
  }
  if (init.body && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }
  if (opts.auth !== false) {
    const token = getToken();
    if (token) {
      headers.set("Authorization", `Bearer ${token}`);
    }
  }

  const response = await fetch(`${apiBase()}${path}`, { ...init, headers });
  if (!response.ok) {
    let message = `Request failed (${response.status})`;
    try {
      const body = await response.json();
      if (body?.message) message = body.message;
    } catch {
      // keep default message
    }
    throw new ApiError(response.status, message);
  }
  if (response.status === 204) {
    return undefined as T;
  }
  return (await response.json()) as T;
}

export function login(username: string, password: string) {
  return request<LoginResponse>(
    "/v1/private/login",
    {
      method: "POST",
      body: JSON.stringify({ username, password }),
    },
    { auth: false },
  );
}

export function getProfile() {
  return request<UserProfile>("/v1/private/user/profile");
}

export type OrderListQuery = {
  store?: string;
  lang?: string;
  count?: number;
  page?: number;
  id?: string;
  name?: string;
  phone?: string;
  email?: string;
  status?: string;
};

export function getOrders(query: OrderListQuery) {
  const params = new URLSearchParams();
  Object.entries(query).forEach(([key, value]) => {
    if (value !== undefined && value !== "") {
      params.set(key, String(value));
    }
  });
  const suffix = params.toString();
  return request<OrdersResponse>(
    `/v1/private/orders${suffix ? `?${suffix}` : ""}`,
  );
}
