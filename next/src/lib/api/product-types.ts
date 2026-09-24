import { getLang, getMerchant } from "@/lib/auth/session";

import { client } from "./client";
import type {
  ProductType,
  ProductTypeDescription,
  ProductTypeListResponse,
  UniqueCodeResponse,
} from "./types";

export type TypeListParams = {
  store?: string;
  lang?: string;
  count?: number;
  page?: number;
};

function storeLangParams() {
  return {
    store: getMerchant() ?? "",
    lang: getLang(),
  };
}

export function getListOfTypes(
  params: TypeListParams,
): Promise<ProductTypeListResponse> {
  return client.get(
    "/v1/private/products/types",
    params,
  ) as Promise<ProductTypeListResponse>;
}

export function getType(
  id: string | number,
  params: { lang?: string; store?: string },
): Promise<ProductType> {
  return client.get(`/v1/private/products/type/${id}`, params) as Promise<ProductType>;
}

export function createType(body: unknown): Promise<unknown> {
  return client.post("/v1/private/products/type", body, {
    params: storeLangParams(),
  });
}

export function updateType(id: string | number, body: unknown): Promise<unknown> {
  return client.put(`/v1/private/products/type/${id}`, body, {
    params: storeLangParams(),
  });
}

export function deleteType(id: string | number): Promise<unknown> {
  return client.delete(`/v1/private/products/type/${id}`, {
    params: storeLangParams(),
  });
}

export function checkTypeCode(code: string): Promise<UniqueCodeResponse> {
  return client.get(`/v1/private/products/type/unique?code=${code}`, {
    ...storeLangParams(),
  }) as Promise<UniqueCodeResponse>;
}

/** Copy the first filled name into empty locales — same idea as brand descriptions. */
export function fillEmptyTypeDescriptions(
  descriptions: ProductTypeDescription[],
): ProductTypeDescription[] | null {
  const name =
    descriptions.find((item) => item.name.trim())?.name.trim() ?? "";
  if (!name) {
    return null;
  }
  return descriptions.map((item) => ({
    language: item.language,
    name: item.name.trim() || name,
  }));
}
