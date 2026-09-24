import { getMerchant } from "@/lib/auth/session";

import { ApiError, client } from "./client";
import type {
  Country,
  Currency,
  LandingPage,
  Measures,
  StoreDetails,
  StoreListParams,
  StoreListResponse,
  StoreName,
  StoreUniqueResponse,
  Zone,
} from "./types";

export function storeCodeTaken(res: StoreUniqueResponse | null | undefined): boolean {
  return !!(res?.exists ?? res?.exist);
}

export function asStoreList(res: unknown): StoreListResponse {
  if (Array.isArray(res)) {
    return { data: res as StoreDetails[], recordsTotal: res.length };
  }
  const body = (res ?? {}) as Partial<StoreListResponse>;
  return {
    data: body.data ?? [],
    recordsTotal: body.recordsTotal ?? body.data?.length ?? 0,
    recordsFiltered: body.recordsFiltered,
    totalPages: body.totalPages,
  };
}

export function asStoreNames(res: unknown): StoreName[] {
  if (Array.isArray(res)) {
    return res as StoreName[];
  }
  const body = res as { data?: StoreName[] } | null;
  return body?.data ?? [];
}

export function getStore(code: string): Promise<StoreDetails> {
  return client.get(`/v1/store/${code}`) as Promise<StoreDetails>;
}

export function getListOfStores(params: StoreListParams): Promise<unknown> {
  return client.get("/v1/private/stores", params);
}

export function getListOfMerchantStoreNames(
  params?: StoreListParams | string,
): Promise<unknown> {
  const query = typeof params === "string" ? undefined : params;
  return client.get("/v1/private/stores/names", query);
}

export function checkIfStoreExist(code: string): Promise<StoreUniqueResponse> {
  return client.get("/v1/private/store/unique", { code }) as Promise<StoreUniqueResponse>;
}

export function createStore(store: unknown): Promise<unknown> {
  return client.post("/v1/private/store", store);
}

export function deleteStore(storeCode: string): Promise<unknown> {
  return client.delete(`/v1/private/store/${storeCode}`);
}

export function updateStore(store: { code: string } & Record<string, unknown>): Promise<unknown> {
  return client.put(`/v1/private/store/${store.code}`, store);
}

/** Angular `getWithEmpty` — 404 must not fail the landing page. */
export async function getPageContent(
  pageCode: string,
  storeCode: string,
): Promise<LandingPage | null> {
  try {
    const res = (await client.get(`/v1/private/content/any/${pageCode}`, {
      lang: "_all",
      store: storeCode,
    })) as LandingPage;
    if (res && typeof res === "object" && res.status) {
      return null;
    }
    return res;
  } catch (error) {
    if (error instanceof ApiError) {
      return null;
    }
    throw error;
  }
}

export function updatePageContent(id: string | number, content: unknown): Promise<unknown> {
  return client.put(`/v1/private/content/${id}`, content);
}

export function createPageContent(content: unknown, storeCode: string): Promise<unknown> {
  return client.postWithStoreParam("/v1/private/content", content, storeCode);
}

export function getBrandingDetails(code: string): Promise<unknown> {
  return client.get(`/v1/private/store/${code}/marketing`);
}

export function updateSocialNetworks(
  body: unknown,
  merchant = getMerchant() ?? "",
): Promise<unknown> {
  return client.post(`/v1/private/store/${merchant}/marketing`, body);
}

export function addStoreLogo(file: File, merchant = getMerchant() ?? ""): Promise<unknown> {
  const uploadData = new FormData();
  uploadData.append("file", file, file.name);
  return client.post(`/v1/private/store/${merchant}/marketing/logo`, uploadData);
}

export function removeStoreLogo(code: string): Promise<unknown> {
  return client.delete(`/v1/private/store/${code}/marketing/logo`);
}

export function getCountries(): Promise<Country[]> {
  return client.get("/v1/country") as Promise<Country[]>;
}

export function getZones(code: string): Promise<Zone[]> {
  return client.get("/v1/zones", { code }) as Promise<Zone[]>;
}

export function getCurrencies(): Promise<Currency[]> {
  return client.get("/v1/currency") as Promise<Currency[]>;
}

export function getMeasures(): Promise<Measures> {
  return client.get("/v1/measures") as Promise<Measures>;
}

export function getStoreLanguages(store: string): Promise<unknown> {
  return client.get("/v1/store/languages", { store });
}
