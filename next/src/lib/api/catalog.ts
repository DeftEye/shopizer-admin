import { client } from "./client";
import type { CatalogProductListResponse, StoreListResponse } from "./types";

export function getStoreLanguages(store: string): Promise<{ code: string }[]> {
  return client.get("/v1/store/languages", { store }) as Promise<
    { code: string }[]
  >;
}

export function getListOfStores(params?: {
  code?: string;
}): Promise<StoreListResponse> {
  return client.get("/v1/private/stores", params) as Promise<StoreListResponse>;
}

/** Used by group edit to pick products — Angular `ProductService.getListOfProducts`. */
export function getListOfProducts(params: {
  store?: string;
  lang?: string;
  count?: number;
  page?: number;
  name?: string;
}): Promise<CatalogProductListResponse> {
  return client.get("/v2/products", params) as Promise<CatalogProductListResponse>;
}
