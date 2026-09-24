import { EMPTY_ROLES, type AccessRoles, type ShopizerUser } from "./types";

const TOKEN_KEY = "token";
const USER_ID_KEY = "userId";
const ROLES_KEY = "roles";
const MERCHANT_KEY = "merchant";
const REMEMBER_KEY = "isRemember";
const LOGIN_EMAIL_KEY = "loginEmail";

function browserStorage(): Storage | null {
  if (typeof window === "undefined") {
    return null;
  }
  return window.localStorage;
}

export function getToken(): string | null {
  return browserStorage()?.getItem(TOKEN_KEY) ?? null;
}

export function saveSession(input: {
  token: string;
  userId?: string | number;
  user?: ShopizerUser;
  roles: AccessRoles;
}): void {
  const storage = browserStorage();
  if (!storage) {
    return;
  }
  storage.setItem(TOKEN_KEY, input.token);
  if (input.userId != null) {
    storage.setItem(USER_ID_KEY, String(input.userId));
  }
  storage.setItem(ROLES_KEY, JSON.stringify(input.roles));
  if (input.user?.merchant) {
    storage.setItem(MERCHANT_KEY, input.user.merchant);
  }
}

export function clearSession(): void {
  const storage = browserStorage();
  if (!storage) {
    return;
  }
  storage.removeItem(TOKEN_KEY);
  storage.removeItem(USER_ID_KEY);
  storage.removeItem(ROLES_KEY);
  storage.removeItem(MERCHANT_KEY);
}

export function readRoles(): AccessRoles {
  const raw = browserStorage()?.getItem(ROLES_KEY);
  if (!raw) {
    return { ...EMPTY_ROLES };
  }
  try {
    return { ...EMPTY_ROLES, ...JSON.parse(raw) };
  } catch {
    return { ...EMPTY_ROLES };
  }
}

export function readMerchant(): string | null {
  return browserStorage()?.getItem(MERCHANT_KEY) ?? null;
}

export function rememberUsername(username: string, remember: boolean): void {
  const storage = browserStorage();
  if (!storage) {
    return;
  }
  storage.setItem(REMEMBER_KEY, remember ? "true" : "false");
  storage.setItem(LOGIN_EMAIL_KEY, remember ? username : "");
}

export function rememberedUsername(): { remember: boolean; username: string } {
  const storage = browserStorage();
  const remember = storage?.getItem(REMEMBER_KEY) === "true";
  return {
    remember,
    username: remember ? (storage?.getItem(LOGIN_EMAIL_KEY) ?? "") : "",
  };
}
