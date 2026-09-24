export const SESSION_KEYS = ["token", "userId", "roles", "merchant"] as const;

export const REQUEST_TIMEOUT_MS = 30_000;

export type QueryParams = Record<
  string,
  string | number | boolean | Array<string | number> | undefined | null
>;

export type RequestOptions = {
  params?: QueryParams;
  headers?: HeadersInit;
};

export class ApiError extends Error {
  status: number;
  body: unknown;

  constructor(status: number, message: string, body?: unknown) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.body = body;
  }
}

function shopizerBaseUrl(): string {
  return process.env.SHOPIZER_API_URL || "/api";
}

function shippingBaseUrl(): string {
  return process.env.SHOPIZER_SHIPPING_API_URL || "/shipping-api";
}

function getToken(): string | null {
  if (typeof localStorage === "undefined") {
    return null;
  }
  return localStorage.getItem("token");
}

export function clearSession(): void {
  if (typeof localStorage === "undefined") {
    return;
  }
  for (const key of SESSION_KEYS) {
    localStorage.removeItem(key);
  }
}

function joinUrl(base: string, path: string): string {
  const normalizedBase = base.replace(/\/$/, "");
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return `${normalizedBase}${normalizedPath}`;
}

function withQuery(url: string, params?: QueryParams): string {
  if (!params) {
    return url;
  }

  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === null) {
      continue;
    }
    if (Array.isArray(value)) {
      for (const item of value) {
        search.append(key, String(item));
      }
    } else {
      search.set(key, String(value));
    }
  }

  const qs = search.toString();
  if (!qs) {
    return url;
  }
  return `${url}${url.includes("?") ? "&" : "?"}${qs}`;
}

function buildHeaders(init?: HeadersInit, jsonBody?: boolean): Headers {
  const headers = new Headers(init);
  const token = getToken();
  if (token && !headers.has("Authorization")) {
    headers.set("Authorization", `Bearer ${token}`);
  }
  if (jsonBody && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }
  return headers;
}

function serializeBody(body: unknown): { payload?: BodyInit; jsonBody: boolean } {
  if (body === undefined || body === null) {
    return { jsonBody: false };
  }
  if (typeof body === "string" || body instanceof FormData) {
    return { payload: body, jsonBody: false };
  }
  return { payload: JSON.stringify(body), jsonBody: true };
}

async function parseBody(response: Response): Promise<unknown> {
  const text = await response.text();
  if (!text) {
    return null;
  }
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

async function request(
  url: string,
  init: { method: string; headers?: HeadersInit; body?: unknown },
): Promise<unknown> {
  const serialized = serializeBody(init.body);
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const response = await fetch(url, {
      method: init.method,
      headers: buildHeaders(init.headers, serialized.jsonBody),
      body: serialized.payload,
      signal: controller.signal,
    });

    if (response.status === 401) {
      clearSession();
    }

    const body = await parseBody(response);
    if (!response.ok) {
      throw new ApiError(
        response.status,
        `Request failed: ${response.status} ${response.statusText}`,
        body,
      );
    }
    return body;
  } finally {
    clearTimeout(timeoutId);
  }
}

export function getBaseUrl(): string {
  return shopizerBaseUrl();
}

export function get(path: string, params?: QueryParams): Promise<unknown> {
  return request(withQuery(joinUrl(shopizerBaseUrl(), path), params), {
    method: "GET",
  });
}

export function post(
  path: string,
  body: unknown,
  options?: RequestOptions,
): Promise<unknown> {
  return request(withQuery(joinUrl(shopizerBaseUrl(), path), options?.params), {
    method: "POST",
    headers: options?.headers,
    body,
  });
}

export function put(
  path: string,
  body: unknown,
  options?: RequestOptions,
): Promise<unknown> {
  return request(withQuery(joinUrl(shopizerBaseUrl(), path), options?.params), {
    method: "PUT",
    headers: options?.headers,
    body,
  });
}

export function patch(
  path: string,
  body: unknown,
  options?: RequestOptions,
): Promise<unknown> {
  return request(withQuery(joinUrl(shopizerBaseUrl(), path), options?.params), {
    method: "PATCH",
    headers: options?.headers,
    body,
  });
}

export function del(
  path: string,
  options?: RequestOptions,
): Promise<unknown> {
  return request(withQuery(joinUrl(shopizerBaseUrl(), path), options?.params), {
    method: "DELETE",
    headers: options?.headers,
  });
}

export function postWithStoreParam(
  path: string,
  body: unknown,
  storeCode?: string,
  options?: RequestOptions,
): Promise<unknown> {
  const scopedPath = storeCode ? `${path}?store=${storeCode}` : path;
  return post(scopedPath, body, options);
}

export function getShipping(
  path: string,
  params?: QueryParams,
): Promise<unknown> {
  return request(withQuery(joinUrl(shippingBaseUrl(), path), params), {
    method: "GET",
  });
}

export function postShipping(
  path: string,
  body: unknown,
  options?: RequestOptions,
): Promise<unknown> {
  return request(withQuery(joinUrl(shippingBaseUrl(), path), options?.params), {
    method: "POST",
    headers: options?.headers,
    body,
  });
}

export function putShipping(
  path: string,
  body: unknown,
  options?: RequestOptions,
): Promise<unknown> {
  return request(withQuery(joinUrl(shippingBaseUrl(), path), options?.params), {
    method: "PUT",
    headers: options?.headers,
    body,
  });
}

export function deleteShipping(
  path: string,
  options?: RequestOptions,
): Promise<unknown> {
  return request(withQuery(joinUrl(shippingBaseUrl(), path), options?.params), {
    method: "DELETE",
    headers: options?.headers,
  });
}

export function listCountriesByLanguage(lang: string): Promise<unknown> {
  return get("/v1/country", { lang });
}

export const client = {
  get,
  post,
  put,
  patch,
  delete: del,
  postWithStoreParam,
  getShipping,
  postShipping,
  putShipping,
  deleteShipping,
  getBaseUrl,
  listCountriesByLanguage,
};
