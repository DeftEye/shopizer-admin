export type LoginResponse = {
  token: string;
  id: number | string;
};

export type UserGroup = {
  id?: number;
  name: string;
};

export type UserProfile = {
  id: number;
  active: boolean;
  defaultLanguage: string;
  emailAddress: string;
  firstName: string;
  groups: UserGroup[];
  lastAccess: string;
  lastName: string;
  loginTime: string;
  merchant: string;
  permissions: unknown[];
  userName: string;
};

export type Language = {
  id: number;
  code: string;
  name: string;
};

export type MerchantAddress = {
  address: string;
  city: string;
  postalCode: string;
  stateProvince: string;
  country: string;
};

export type Merchant = {
  id: number;
  name: string;
  code: string;
  retailer?: boolean;
  phone?: string;
  address?: MerchantAddress;
  supportedLanguages?: Language[];
};

export type Country = {
  id: number;
  code: string;
  name: string;
  zones: unknown[];
};

export type Zone = {
  id?: number;
  code: string;
  name: string;
};

export type StoreUniqueResponse = {
  exists: boolean;
};

export type RoleFlags = {
  canAccessToOrder: boolean;
  isSuperadmin: boolean;
  isAdmin: boolean;
  isAdminCatalogue: boolean;
  isAdminStore: boolean;
  isAdminOrder: boolean;
  isAdminContent: boolean;
  isCustomer: boolean;
  isAdminRetail: boolean;
};

export type UniqueCodeResponse = {
  exists: boolean;
};

export type BrandDescription = {
  language: string;
  name: string;
  highlights: string;
  friendlyUrl: string;
  description: string;
  title: string;
  keyWords: string;
  metaDescription: string;
};

export type Brand = {
  id?: number;
  code: string;
  order?: number | string;
  descriptions?: BrandDescription[];
  description?: { name?: string };
};

export type BrandListResponse = {
  recordsTotal: number;
  manufacturers: Brand[];
};

export type ProductTypeDescription = {
  language: string;
  name: string;
};

export type ProductType = {
  id?: number | string;
  code: string;
  store?: string;
  allowAddToCart?: boolean;
  visible?: boolean | string;
  description?: ProductTypeDescription;
  descriptions?: ProductTypeDescription[];
};

export type ProductTypeListResponse = {
  recordsTotal: number;
  list: ProductType[];
};

export type ProductGroup = {
  code: string;
  active: boolean;
};

export type CatalogProduct = {
  id: number;
  description?: { name?: string };
};

export type CatalogProductListResponse = {
  products: CatalogProduct[];
};

export type StoreName = {
  code: string;
};

export type StoreListResponse = {
  data: StoreName[];
};
