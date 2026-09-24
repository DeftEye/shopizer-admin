import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  checkIfUserExist,
  createUser,
  deleteUser,
  getAdminGroups,
  getMerchantStoreNames,
  getUser,
  getUserProfile,
  getUsersList,
  updatePassword,
  updateUser,
  updateUserEnabled,
} from "./users";

const API_URL = "http://localhost:8080/api";

function mockFetch(jsonBody: unknown = {}) {
  const fetchMock = vi.fn().mockResolvedValue({
    ok: true,
    status: 200,
    statusText: "OK",
    text: async () => JSON.stringify(jsonBody),
  });
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
}

const userPayload = {
  firstName: "Pat",
  lastName: "Lee",
  store: "DEFAULT",
  userName: "pat@shopizer.com",
  emailAddress: "pat@shopizer.com",
  password: "Passw0rd",
  repeatPassword: "Passw0rd",
  active: true,
  defaultLanguage: "en",
  groups: [{ id: 1, name: "ADMIN" }],
};

describe("users api", () => {
  beforeEach(() => {
    process.env.SHOPIZER_API_URL = API_URL;
    localStorage.clear();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    localStorage.clear();
  });

  it("hits the Angular user endpoints and query names", async () => {
    const fetchMock = mockFetch({ data: [], recordsTotal: 0, totalPages: 0 });

    await getUserProfile();
    await getUser(4);
    await getUsersList({ store: "DEFAULT", lang: "en", count: 15, page: 0 });
    await checkIfUserExist({ unique: "pat@shopizer.com", merchant: "DEFAULT" });
    await createUser(userPayload, "DEFAULT");
    await updateUser(4, userPayload, "DEFAULT");
    await deleteUser(4, "DEFAULT");
    await updatePassword(4, { password: "old", changePassword: "Passw0rd" });
    await updateUserEnabled({
      id: 4,
      active: false,
      defaultLanguage: "en",
      emailAddress: "pat@shopizer.com",
      firstName: "Pat",
      lastName: "Lee",
      groups: [],
      lastAccess: "",
      loginTime: "",
      merchant: "DEFAULT",
      permissions: [],
      userName: "pat@shopizer.com",
    });
    await getAdminGroups();
    await getMerchantStoreNames("DEFAULT");

    expect(fetchMock.mock.calls.map((call) => [call[0], (call[1] as RequestInit).method])).toEqual([
      [`${API_URL}/v1/private/user/profile`, "GET"],
      [`${API_URL}/v1/private/users/4`, "GET"],
      [`${API_URL}/v1/private/users?store=DEFAULT&lang=en&count=15&page=0`, "GET"],
      [`${API_URL}/v1/private/user/unique`, "POST"],
      [`${API_URL}/v1/private/user/?store=DEFAULT`, "POST"],
      [`${API_URL}/v1/private/user/4?store=DEFAULT`, "PUT"],
      [`${API_URL}/v1/private/user/4?store=DEFAULT`, "DELETE"],
      [`${API_URL}/v1/private/user/4/password`, "PATCH"],
      [`${API_URL}/v1/private/user/4/enabled`, "PATCH"],
      [`${API_URL}/v1/sec/private/groups`, "GET"],
      [`${API_URL}/v1/private/stores/names?store=DEFAULT`, "GET"],
    ]);
  });

  it("sends change-password as { password, changePassword }", async () => {
    const fetchMock = mockFetch({});
    await updatePassword("1", { password: "old", changePassword: "Newpass1" });
    expect((fetchMock.mock.calls[0][1] as RequestInit).body).toBe(
      JSON.stringify({ password: "old", changePassword: "Newpass1" }),
    );
  });
});
