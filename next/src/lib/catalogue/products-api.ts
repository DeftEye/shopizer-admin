import { ApiError, client } from "@/lib/api/client";

import {
  CATEGORY_LIST_COUNT,
  ORDERING_LANG,
  ORDERING_PAGE_SIZE,
} from "./constants";
import type {
  CategoryListResponse,
  ProductDetail,
  ProductListResponse,
  StoreListResponse,
  UniqueCodeResponse,
} from "./types";

export type ProductListParams = {
  store: string;
  lang: string;
  count: number;
  page: number;
  origin?: string;
  sku?: string;
  name?: string;
};

export function listProducts(params: ProductListParams) {
  return client.get("/v2/products", {
    origin: "admin",
    ...params,
  }) as Promise<ProductListResponse>;
}

export function getProductById(id: string | number) {
  return client.get(`/v1/product/${id}`, { lang: "_all" }) as Promise<ProductDetail>;
}

export function createProduct(product: unknown, store: string) {
  return client.post("/v2/private/product/definition", product, {
    params: { store },
  });
}

export function updateProduct(
  id: string | number,
  product: unknown,
  store: string,
) {
  return client.put(`/v2/private/product/${id}`, product, {
    params: { store },
  });
}

export function updateProductFromTable(
  id: string | number,
  product: { available: boolean; price: unknown; quantity: unknown },
) {
  return client.patch(`/v1/private/product/${id}`, product);
}

export function deleteProduct(id: string | number) {
  return client.delete(`/v1/private/product/${id}`);
}

export function getProductTypes() {
  return client.get("/v1/private/product/types") as Promise<{
    list?: Array<{ code?: string }>;
  }>;
}

export function checkProductSku(code: string) {
  return client.get("/v1/private/product/unique", {
    code,
  }) as Promise<UniqueCodeResponse>;
}

export function getManufacturers() {
  return client.get("/v1/manufacturers/") as Promise<{
    manufacturers?: Array<{ code?: string }>;
  }>;
}

export function getStoreLanguages(store: string) {
  return client.get("/v1/store/languages", { store }) as Promise<
    Array<{ code: string; name?: string }>
  >;
}

export function listStores() {
  return client.get("/v1/private/stores", {
    code: "DEFAULT",
  }) as Promise<StoreListResponse>;
}

export function getProductsByOrder() {
  return client.get("/v1/product", {
    count: ORDERING_PAGE_SIZE,
    lang: ORDERING_LANG,
    page: 0,
  }) as Promise<ProductListResponse>;
}

export function getProductsByCategory(categoryId: string | number) {
  return client.get("/v1/product", {
    category: categoryId,
    count: ORDERING_PAGE_SIZE,
    lang: ORDERING_LANG,
    page: 0,
  }) as Promise<ProductListResponse>;
}

export function listCategories(lang: string) {
  return client.get("/v1/category", {
    count: CATEGORY_LIST_COUNT,
    page: 0,
    lang,
  }) as Promise<CategoryListResponse>;
}

export function readApiErrorMessage(error: unknown, fallback: string): string {
  if (error instanceof ApiError) {
    const body = error.body;
    if (body && typeof body === "object" && "message" in body) {
      const message = (body as { message?: unknown }).message;
      if (message) {
        return String(message);
      }
    }
  }
  return fallback;
}
