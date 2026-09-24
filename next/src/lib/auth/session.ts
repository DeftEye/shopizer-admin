import type { Language, RoleFlags } from "@/lib/api/types";
import { readEnv } from "@/lib/env";

import { EMPTY_ROLE_FLAGS } from "./roles";

export const AUTH_KEYS = {
  token: "token",
  userId: "userId",
  roles: "roles",
  merchant: "merchant",
  lang: "lang",
  merchantName: "merchantName",
  merchantLanguage: "merchantLanguage",
  supportedLanguages: "supportedLanguages",
  defaultCountry: "defaultCountry",
  isRemember: "isRemember",
  loginEmail: "loginEmail",
} as const;

function storage(): Storage | null {
  if (typeof localStorage === "undefined") {
    return null;
  }
  return localStorage;
}

export function getToken(): string | null {
  return storage()?.getItem(AUTH_KEYS.token) ?? null;
}

export function clearTokenCookie(): void {
  if (typeof document === "undefined") {
    return;
  }
  document.cookie = "token=; path=/; max-age=0; SameSite=Lax";
}

/** JWT stays in localStorage (Angular). A readable cookie is only for middleware. */
export function saveToken(token: string): void {
  storage()?.setItem(AUTH_KEYS.token, token);
  if (typeof document !== "undefined") {
    document.cookie = `token=${encodeURIComponent(token)}; path=/; SameSite=Lax`;
  }
}

export function syncTokenCookie(): void {
  const token = getToken();
  if (token) {
    saveToken(token);
  } else {
    clearTokenCookie();
  }
}

export function getUserId(): string | null {
  return storage()?.getItem(AUTH_KEYS.userId) ?? null;
}

export function saveUserId(id: string): void {
  storage()?.setItem(AUTH_KEYS.userId, String(id));
}

export function getMerchant(): string | null {
  return storage()?.getItem(AUTH_KEYS.merchant) ?? null;
}

export function saveMerchant(code: string): void {
  storage()?.setItem(AUTH_KEYS.merchant, code);
}

export function getRoles(): RoleFlags {
  const raw = storage()?.getItem(AUTH_KEYS.roles);
  if (!raw) {
    return { ...EMPTY_ROLE_FLAGS };
  }
  try {
    return { ...EMPTY_ROLE_FLAGS, ...(JSON.parse(raw) as RoleFlags) };
  } catch {
    return { ...EMPTY_ROLE_FLAGS };
  }
}

export function saveRoles(roles: RoleFlags): void {
  storage()?.setItem(AUTH_KEYS.roles, JSON.stringify(roles));
}

export function getLang(): string {
  return storage()?.getItem(AUTH_KEYS.lang) || readEnv().defaultLang;
}

export function setLang(lang: string): void {
  storage()?.setItem(AUTH_KEYS.lang, lang);
}

export function isRememberEnabled(): boolean {
  return storage()?.getItem(AUTH_KEYS.isRemember) === "true";
}

export function getRememberedEmail(): string {
  if (!isRememberEnabled()) {
    return "";
  }
  return storage()?.getItem(AUTH_KEYS.loginEmail) ?? "";
}

export function setRemember(remember: boolean, email?: string): void {
  const store = storage();
  if (!store) {
    return;
  }
  store.setItem(AUTH_KEYS.isRemember, remember ? "true" : "false");
  if (email !== undefined) {
    store.setItem(AUTH_KEYS.loginEmail, remember ? email : "");
  }
}

export function persistMerchantHome(details: {
  merchantLanguage: string;
  merchantName: string;
  supportedLanguages: Language[] | undefined;
  defaultCountry: string;
}): void {
  const store = storage();
  if (!store) {
    return;
  }
  store.setItem(AUTH_KEYS.merchantLanguage, details.merchantLanguage);
  store.setItem(AUTH_KEYS.merchantName, details.merchantName);
  store.setItem(
    AUTH_KEYS.supportedLanguages,
    JSON.stringify(details.supportedLanguages ?? []),
  );
  store.setItem(AUTH_KEYS.defaultCountry, details.defaultCountry);
}

/** Angular `AuthService.logout` — token, userId, roles, merchant only. */
export function logoutSession(): void {
  const store = storage();
  if (store) {
    store.removeItem(AUTH_KEYS.token);
    store.removeItem(AUTH_KEYS.userId);
    store.removeItem(AUTH_KEYS.roles);
    store.removeItem(AUTH_KEYS.merchant);
  }
  clearTokenCookie();
}
