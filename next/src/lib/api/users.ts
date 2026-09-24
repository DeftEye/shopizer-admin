import { client, type QueryParams } from "@/lib/api/client";
import type {
  SecurityGroup,
  StoreName,
  UniqueResponse,
  UserListResponse,
  UserPasswordPayload,
  UserProfile,
  UserWritePayload,
} from "@/lib/api/types";

function asArray<T>(body: unknown): T[] {
  if (Array.isArray(body)) {
    return body as T[];
  }
  if (body && typeof body === "object" && Array.isArray((body as { data?: unknown }).data)) {
    return (body as { data: T[] }).data;
  }
  return [];
}

export function getUserProfile(): Promise<UserProfile> {
  return client.get("/v1/private/user/profile") as Promise<UserProfile>;
}

export function getUser(id: string | number): Promise<UserProfile> {
  return client.get(`/v1/private/users/${id}`) as Promise<UserProfile>;
}

export function getUsersList(params: QueryParams): Promise<UserListResponse> {
  return client.get("/v1/private/users", params) as Promise<UserListResponse>;
}

export function checkIfUserExist(body: {
  unique: string;
  merchant?: string | null;
}): Promise<UniqueResponse> {
  return client.post("/v1/private/user/unique", body) as Promise<UniqueResponse>;
}

export function createUser(
  user: UserWritePayload,
  store: string,
): Promise<unknown> {
  return client.post("/v1/private/user/", user, { params: { store } });
}

export function updateUser(
  id: string | number,
  user: UserWritePayload,
  store: string,
): Promise<unknown> {
  return client.put(`/v1/private/user/${id}`, user, { params: { store } });
}

export function deleteUser(
  id: string | number,
  store: string,
): Promise<unknown> {
  return client.delete(`/v1/private/user/${id}`, { params: { store } });
}

export function updatePassword(
  id: string | number,
  passwords: UserPasswordPayload,
): Promise<unknown> {
  return client.patch(`/v1/private/user/${id}/password`, passwords);
}

export function updateUserEnabled(user: UserProfile): Promise<unknown> {
  return client.patch(`/v1/private/user/${user.id}/enabled`, user);
}

/** Groups for the user form — not a store-management screen. */
export function getAdminGroups(): Promise<SecurityGroup[]> {
  return client.get("/v1/sec/private/groups").then((body) =>
    asArray<SecurityGroup>(body),
  );
}

/** Merchant codes for the user-form store field. */
export function getMerchantStoreNames(store: string): Promise<StoreName[]> {
  return client
    .get("/v1/private/stores/names", { store })
    .then((body) => asArray<StoreName>(body));
}
