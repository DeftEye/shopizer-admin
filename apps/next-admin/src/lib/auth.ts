import { emptyRoles } from "./roles";
import type { RoleFlags } from "./types";

/** Storage keys match Angular TokenService / UserService / StorageService. */
export const STORAGE = {
  token: "token",
  userId: "userId",
  roles: "roles",
  merchant: "merchant",
  lang: "lang",
  isRemember: "isRemember",
  loginEmail: "loginEmail",
} as const;

export function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(STORAGE.token);
}

export function getMerchant(): string {
  if (typeof window === "undefined") return "";
  return localStorage.getItem(STORAGE.merchant) ?? "";
}

export function getLanguage(): string {
  if (typeof window === "undefined") return "en";
  return localStorage.getItem(STORAGE.lang) || "en";
}

export function getRoles(): RoleFlags {
  if (typeof window === "undefined") return emptyRoles();
  const raw = localStorage.getItem(STORAGE.roles);
  if (!raw) return emptyRoles();
  try {
    return { ...emptyRoles(), ...JSON.parse(raw) };
  } catch {
    return emptyRoles();
  }
}

export function persistSession(input: {
  token: string;
  userId: string | number;
  merchant?: string;
  roles: RoleFlags;
  language?: string;
}) {
  localStorage.setItem(STORAGE.token, input.token);
  localStorage.setItem(STORAGE.userId, String(input.userId));
  localStorage.setItem(STORAGE.roles, JSON.stringify(input.roles));
  if (input.merchant) {
    localStorage.setItem(STORAGE.merchant, input.merchant);
  }
  if (input.language) {
    localStorage.setItem(STORAGE.lang, input.language);
  }
}

export function clearSession() {
  localStorage.removeItem(STORAGE.token);
  localStorage.removeItem(STORAGE.userId);
  localStorage.removeItem(STORAGE.roles);
  localStorage.removeItem(STORAGE.merchant);
}

export function rememberUsername(username: string, remember: boolean) {
  localStorage.setItem(STORAGE.isRemember, remember ? "true" : "false");
  localStorage.setItem(STORAGE.loginEmail, remember ? username : "");
}

export function rememberedUsername(): { username: string; remember: boolean } {
  const remember = localStorage.getItem(STORAGE.isRemember) === "true";
  return {
    remember,
    username: remember ? localStorage.getItem(STORAGE.loginEmail) ?? "" : "",
  };
}
