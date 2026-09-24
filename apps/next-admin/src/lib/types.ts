export type OrderStatus =
  | "ORDERED"
  | "PROCESSED"
  | "DELIVERED"
  | "REFUNDED"
  | "CANCELED"
  | string;

export type Order = {
  id: number;
  billing?: {
    firstName?: string;
    lastName?: string;
    phone?: string;
    email?: string;
  };
  total?: { value?: string | number };
  datePurchased?: string;
  orderStatus?: OrderStatus;
};

export type OrdersResponse = {
  orders?: Order[];
  recordsTotal?: number;
};

export type LoginResponse = {
  token: string;
  id: string | number;
};

export type UserGroup = { name: string };

export type UserProfile = {
  id?: string | number;
  userName?: string;
  merchant?: string;
  groups?: UserGroup[];
  defaultLanguage?: string;
  lastAccess?: string;
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

export const ORDER_STATUSES = [
  "ORDERED",
  "PROCESSED",
  "DELIVERED",
  "REFUNDED",
  "CANCELED",
] as const;
