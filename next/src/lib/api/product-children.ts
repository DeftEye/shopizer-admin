import { client } from "@/lib/api/client";
import { getLang, getMerchant } from "@/lib/auth/session";

export type ProductImage = {
  id: number | string;
  name?: string;
  path?: string;
  imageUrl?: string;
  imageName?: string;
};

export type ProductDescription = {
  id?: number;
  language?: string;
  name?: string;
  highlights?: string;
  friendlyUrl?: string;
  description?: string;
  title?: string;
  keyWords?: string;
  metaDescription?: string;
};

export type ProductSummary = {
  id: number | string;
  sku?: string;
  description?: ProductDescription;
  images?: ProductImage[];
};

export type StoreOption = {
  code: string;
  name?: string;
};

export type StoresListResponse = {
  data?: StoreOption[];
};

export type InventoryPrice = {
  id?: number;
  originalPrice?: string;
  finalPrice?: string;
  discountedPrice?: string;
  discounted?: boolean | string;
  descriptions?: ProductDescription[];
};

export type InventoryItem = {
  id?: number | string;
  store?: { code?: string } | string;
  owner?: string | null;
  quantity?: number;
  prices?: InventoryPrice[];
  creationDate?: string;
  available?: boolean;
  sku?: string;
  dateAvailable?: string;
  variant?: string | number;
  productSpecifications?: {
    weight?: string | number;
    height?: string | number;
    width?: string | number;
    length?: string | number;
  };
};

export type InventoryListResponse = {
  recordsTotal?: number;
  items?: InventoryItem[];
};

export type ProductAttribute = {
  id?: number;
  option?: { code?: string };
  optionValue?: { code?: string };
  attributeDisplayOnly?: boolean;
  productAttributePrice?: string | number;
  productAttributeUnformattedPrice?: string | number;
  sortOrder?: number | string;
  attributeDefault?: boolean;
  requiredOption?: boolean;
  productAttributeWeight?: number | string;
};

export type AttributesListResponse = {
  recordsTotal?: number;
  attributes?: ProductAttribute[];
};

export type OptionChoice = {
  code: string;
};

export type OptionsListResponse = {
  options?: OptionChoice[];
  recordsTotal?: number;
};

export type OptionValuesListResponse = {
  optionValues?: OptionChoice[];
  recordsTotal?: number;
};

export type LanguageOption = {
  code: string;
  name?: string;
};

export function normalizeImages(res: unknown): ProductImage[] {
  if (Array.isArray(res)) {
    return res as ProductImage[];
  }
  if (
    res &&
    typeof res === "object" &&
    "images" in res &&
    Array.isArray((res as { images: unknown }).images)
  ) {
    return (res as { images: ProductImage[] }).images;
  }
  return [];
}

export function getProductById(id: string | number): Promise<ProductSummary> {
  return client.get(`/v1/product/${id}`, { lang: "_all" }) as Promise<ProductSummary>;
}

export function getProductImages(productId: string | number): Promise<unknown> {
  return client.get(`/v1/product/${productId}/images`);
}

export function addImageUrl(productId: string | number): string {
  return `${client.getBaseUrl()}/v1/private/product/${productId}/images`;
}

export function createProductImage(
  productId: string | number,
  uploadData: FormData,
): Promise<unknown> {
  return client.post(`/v1/private/product/${productId}/images`, uploadData);
}

export function removeProductImage(
  productId: string | number,
  imageId: string | number,
): Promise<unknown> {
  return client.delete(`/v1/private/product/${productId}/image/${imageId}`);
}

export function updateProductImageOrder(
  productId: string | number,
  event: { id: string | number; position: number },
): Promise<unknown> {
  return client.patch(
    `/v1/private/product/${productId}/image/${event.id}`,
    [],
    { params: { order: event.position } },
  );
}

export function getInventories(
  productId: string | number,
  params: { count: number; page: number; lang?: string },
): Promise<InventoryListResponse> {
  return client.get(`/v1/private/product/${productId}/inventory`, params) as Promise<InventoryListResponse>;
}

export function createInventory(inventory: unknown): Promise<InventoryItem> {
  return client.post(`/v1/private/product/inventory`, inventory) as Promise<InventoryItem>;
}

export function getInventoryById(
  productId: string | number,
  inventoryId: string | number,
): Promise<InventoryItem> {
  return client.get(`/v1/private/product/${productId}/inventory/${inventoryId}`, {
    lang: "_all",
  }) as Promise<InventoryItem>;
}

export function deleteInventory(inventoryId: string | number): Promise<unknown> {
  return client.delete(`/v1/private/product/inventory/${inventoryId}`);
}

export function updateInventory(
  productId: string | number,
  inventoryId: string | number,
  inventory: unknown,
): Promise<unknown> {
  return client.put(
    `/v1/private/product/${productId}/inventory/${inventoryId}`,
    inventory,
  );
}

export function listAttributesParams(perPage: number, page: number) {
  return {
    store: getMerchant(),
    lang: "_all",
    count: perPage,
    page,
  };
}

export function getProductAttributes(
  productId: string | number,
  params: Record<string, string | number | null | undefined>,
): Promise<AttributesListResponse> {
  return client.get(
    `/v1/private/product/${productId}/attributes`,
    params,
  ) as Promise<AttributesListResponse>;
}

export function createAttribute(
  productId: string | number,
  attribute: unknown,
): Promise<unknown> {
  return client.post(`/v1/private/product/${productId}/attribute`, attribute);
}

export function updateAttribute(
  productId: string | number,
  attributeId: string | number,
  attribute: unknown,
): Promise<unknown> {
  return client.put(
    `/v1/private/product/${productId}/attribute/${attributeId}`,
    attribute,
  );
}

export function deleteAttribute(
  productId: string | number,
  attributeId: string | number,
): Promise<unknown> {
  return client.delete(
    `/v1/private/product/${productId}/attribute/${attributeId}`,
  );
}

export function getAttributeById(
  productId: string | number,
  attributeId: string | number,
  params: Record<string, string | number | undefined> = {},
): Promise<ProductAttribute> {
  return client.get(
    `/v1/private/product/${productId}/attribute/${attributeId}`,
    params,
  ) as Promise<ProductAttribute>;
}

export function getListOfOptions(
  params: Record<string, string | number | undefined>,
): Promise<OptionsListResponse> {
  return client.get(`/v1/private/product/options`, params) as Promise<OptionsListResponse>;
}

export function getListOfOptionValues(
  params: Record<string, string | number | null | undefined>,
): Promise<OptionValuesListResponse> {
  return client.get(
    `/v1/private/product/options/values`,
    params,
  ) as Promise<OptionValuesListResponse>;
}

export function getListOfStores(
  params: Record<string, string | number | undefined> = {},
): Promise<StoresListResponse> {
  return client.get(`/v1/private/stores`, params) as Promise<StoresListResponse>;
}

export function getSupportedLanguages(store?: string | null): Promise<LanguageOption[]> {
  return client.get(`/v1/store/languages`, {
    store: store ?? getMerchant() ?? "",
  }) as Promise<LanguageOption[]>;
}

export function inventoryListQuery() {
  return {
    count: 10,
    page: 0,
    lang: getLang(),
  };
}
