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
