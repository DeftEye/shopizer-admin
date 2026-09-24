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

export type StoreParent = {
  id?: number;
  code: string;
  name?: string;
  retailer?: boolean;
};

export type StoreLogo = {
  id?: number;
  name?: string;
  path?: string;
  imageName?: string;
  imageUrl?: string;
};

export type StoreDetails = Merchant & {
  email?: string;
  defaultLanguage?: string;
  currency?: string;
  currencyFormatNational?: boolean;
  weight?: string;
  dimension?: string;
  inBusinessSince?: string;
  useCache?: boolean;
  parent?: StoreParent | null;
  logo?: StoreLogo | null;
};

export type StoreListParams = {
  store?: string;
  count?: number;
  page?: number;
  name?: string;
  email?: string;
  code?: string;
  start?: number;
  length?: number;
  retailers?: boolean;
  retailer?: boolean;
};

export type StoreListResponse = {
  data: StoreDetails[];
  recordsTotal: number;
  recordsFiltered?: number;
  totalPages?: number;
};

export type StoreName = {
  id?: number;
  code: string;
  name?: string;
  email?: string;
};

export type Currency = {
  code: string;
};

export type Measures = {
  weights: string[];
  measures: string[];
};

export type LandingDescription = {
  language: string;
  name: string;
  metaDescription?: string;
  id?: string | number;
  keyWords?: string;
  description?: string;
};

export type LandingPage = {
  id?: number | string;
  code?: string;
  name?: string;
  descriptions?: LandingDescription[];
  status?: number;
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
  exists?: boolean;
  exist?: boolean;
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
