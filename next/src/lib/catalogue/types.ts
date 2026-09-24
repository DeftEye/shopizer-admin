export type ProductDescription = {
  language: string;
  name: string;
  highlights: string;
  friendlyUrl: string;
  description: string;
  title: string;
  keyWords: string;
  metaDescription: string;
};

export type ProductSpecifications = {
  weight: string;
  height: string;
  width: string;
  length: string;
};

export type ProductDefinitionForm = {
  sku: string;
  visible: boolean;
  dateAvailable: string;
  manufacturer: string;
  type: string;
  display: boolean;
  canBePurchased: boolean;
  timeBound: boolean;
  price: string;
  quantity: string;
  sortOrder: string;
  productSpecifications: ProductSpecifications;
  selectedLanguage: string;
  descriptions: ProductDescription[];
};

export type ProductDefinitionPayload = Omit<
  ProductDefinitionForm,
  "selectedLanguage"
>;

export type ProductListItem = {
  id: number;
  sku: string;
  name?: string;
  description?: { name?: string };
  quantity?: number | string;
  available?: boolean;
  price?: string | number;
  creationDate?: string;
};

export type ProductListResponse = {
  products?: ProductListItem[];
  recordsTotal?: number;
};

export type CodedOption = {
  code: string;
};

export type ProductDetail = {
  id?: number;
  sku?: string;
  visible?: boolean;
  canBePurchased?: boolean;
  dateAvailable?: string;
  manufacturer?: CodedOption | null;
  type?: CodedOption | null;
  price?: string | number;
  quantity?: string | number;
  sortOrder?: string | number;
  productSpecifications?: Partial<ProductSpecifications> | null;
  descriptions?: Partial<ProductDescription>[];
  images?: unknown[];
};

export type UniqueCodeResponse = {
  exists?: boolean;
};

export type StoreListResponse = {
  data?: Array<{ code?: string }>;
};

export type CategoryListItem = {
  id: number;
  code: string;
  description?: { name?: string };
};

export type CategoryListResponse = {
  categories?: CategoryListItem[];
};

export type OrderProduct = {
  id: number;
  name: string;
  sku: string;
  quantity?: number | string;
  price?: string | number;
  creationDate?: string;
};
