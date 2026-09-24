import { client } from "./client";
import type {
  CatalogProductListResponse,
  ProductGroup,
} from "./types";

export function getListOfProductGroups(store: string): Promise<ProductGroup[]> {
  return client.get("/v1/private/product/groups", {
    store,
  }) as Promise<ProductGroup[]>;
}

export function createProductGroup(group: unknown): Promise<unknown> {
  return client.post("/v1/private/product/group", group);
}

export function updateGroupActiveValue(group: {
  code: string;
  active: boolean;
}): Promise<unknown> {
  return client.patch(`/v1/private/product/group/${group.code}`, group);
}

export function addProductToGroup(
  productId: string | number,
  groupCode: string,
): Promise<unknown> {
  return client.post(`/v1/private/product/${productId}/group/${groupCode}`, {});
}

export function removeProductFromGroup(
  productId: string | number,
  groupCode: string,
): Promise<unknown> {
  return client.delete(`/v1/private/product/${productId}/group/${groupCode}`);
}

export function getProductsByGroup(
  groupCode: string,
  params: { store?: string; lang?: string },
): Promise<CatalogProductListResponse> {
  return client.get(
    `/v1/product/group/${groupCode}`,
    params,
  ) as Promise<CatalogProductListResponse>;
}

export function removeProductGroup(groupCode: string): Promise<unknown> {
  return client.delete(`/v1/product/group/${groupCode}`);
}
