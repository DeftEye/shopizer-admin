import { ApiError, client } from "@/lib/api/client";
import type { LoginResponse, UserProfile } from "@/lib/api/types";

import { checkForAccess } from "./roles";
import { saveMerchant, saveRoles, saveToken, saveUserId, setRemember } from "./session";

/** Angular `Validators.email` — sufficient for login username. */
export const EMAIL_PATTERN =
  /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;

/** Register / forgot template pattern. */
export const STRICT_EMAIL_PATTERN =
  /^[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]{2,}[.][a-zA-Z0-9-.]{2,}$/;

export function isEmail(value: string): boolean {
  return EMAIL_PATTERN.test(value.trim());
}

export function isStrictEmail(value: string): boolean {
  return STRICT_EMAIL_PATTERN.test(value.trim());
}

export async function loginWithCredentials(
  username: string,
  password: string,
  remember: boolean,
): Promise<UserProfile> {
  const res = (await client.post("/v1/private/login", {
    username,
    password,
  })) as LoginResponse;

  saveToken(String(res.token));
  saveUserId(String(res.id));

  const user = (await client.get("/v1/private/user/profile")) as UserProfile;
  saveRoles(checkForAccess(user.groups ?? []));
  saveMerchant(user.merchant);
  setRemember(remember, username);
  return user;
}

export function loginErrorMessage(
  error: unknown,
  t: (key: string) => string,
): string {
  if (error instanceof ApiError) {
    return t("LOGIN.INVALID_DATA");
  }
  return t("COMMON.INTERNAL_SERVER_ERROR");
}
