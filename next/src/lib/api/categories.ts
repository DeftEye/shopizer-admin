import { ApiError, client } from "@/lib/api/client";
import type {
  CategoryDetail,
  CategoryListResponse,
  CategoryNode,
  StoreLanguage,
  StoreName,
  UniqueCodeResponse,
} from "@/lib/categories/types";

export type CategoryListParams = {
  store: string;
  lang: string;
  count?: number;
  page: number;
  name?: string;
};

export function listCategories(params: CategoryListParams) {
  return client.get("/v1/category", params) as Promise<CategoryListResponse>;
}

export function getCategoryById(id: string | number) {
  return client.get(`/v1/category/${id}`, { lang: "_all" }) as Promise<CategoryDetail>;
}

export function addCategory(category: unknown) {
  return client.post("/v1/private/category", category);
}

export function updateCategory(id: string | number, category: unknown) {
  return client.put(`/v1/private/category/${id}`, category);
}

export function updateCategoryVisibility(category: CategoryNode) {
  return client.patch(`/v1/private/category/${category.id}/visible`, category);
}

export function deleteCategory(id: string | number) {
  return client.delete(`/v1/private/category/${id}`);
}

export function checkCategoryCode(code: string) {
  return client.get("/v1/private/category/unique", {
    code,
  }) as Promise<UniqueCodeResponse>;
}

export function updateHierarchy(childId: string | number, parentId: string | number) {
  return client.put(`/v1/private/category/${childId}/move/${parentId}`, {});
}

export function listStoreNames() {
  return client.get("/v1/private/stores/names", { store: "" }) as Promise<
    StoreName[] | { data?: StoreName[] }
  >;
}

export function getStoreLanguages(store: string) {
  return client.get("/v1/store/languages", { store }) as Promise<StoreLanguage[]>;
}

export function normalizeStoreNames(
  result: StoreName[] | { data?: StoreName[] } | null | undefined,
): string[] {
  const rows = Array.isArray(result) ? result : (result?.data ?? []);
  return rows
    .map((store) => store.code)
    .filter((code): code is string => !!code);
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
