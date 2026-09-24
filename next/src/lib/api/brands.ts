import { client } from "./client";
import type {
  Brand,
  BrandDescription,
  BrandListResponse,
  UniqueCodeResponse,
} from "./types";

export type BrandListParams = {
  store?: string;
  lang?: string;
  count?: number;
  page?: number;
};

export function emptyBrandDescription(language: string): BrandDescription {
  return {
    language,
    name: "",
    highlights: "",
    friendlyUrl: "",
    description: "",
    title: "",
    keyWords: "",
    metaDescription: "",
  };
}

export function getListOfBrands(
  params: BrandListParams,
): Promise<BrandListResponse> {
  return client.get("/v1/private/manufacturers/", params) as Promise<BrandListResponse>;
}

export function getBrandById(id: string | number): Promise<Brand> {
  return client.get(`/v1/manufacturers/${id}`, { lang: "_all" }) as Promise<Brand>;
}

export function createBrand(brand: unknown): Promise<unknown> {
  return client.post("/v1/private/manufacturer", brand);
}

export function updateBrand(id: string | number, brand: unknown): Promise<unknown> {
  return client.put(`/v1/private/manufacturer/${id}`, brand);
}

export function deleteBrand(id: string | number): Promise<unknown> {
  return client.delete(`/v1/manufacturer/${id}`);
}

export function checkBrandCode(code: string): Promise<UniqueCodeResponse> {
  return client.get("/v1/private/manufacturer/unique", {
    code,
  }) as Promise<UniqueCodeResponse>;
}

export function fillEmptyBrandDescriptions(
  descriptions: BrandDescription[],
): BrandDescription[] | null {
  const tmp: Record<string, string> = { name: "", friendlyUrl: "" };
  for (const el of descriptions) {
    if (tmp.name === "" && el.name !== "") {
      tmp.name = el.name;
    }
    if (tmp.friendlyUrl === "" && el.friendlyUrl !== "") {
      tmp.friendlyUrl = el.friendlyUrl;
    }
    for (const [key, value] of Object.entries(el)) {
      if (!(key in tmp) && value !== "") {
        tmp[key] = String(value ?? "");
      }
    }
  }

  if (tmp.name === "" || tmp.friendlyUrl === "") {
    return null;
  }

  return descriptions.map((el) => {
    const next: BrandDescription = { ...el };
    (Object.keys(next) as (keyof BrandDescription)[]).forEach((key) => {
      if (next[key] === "" && tmp[key]) {
        next[key] = tmp[key];
      }
      if (next[key] === undefined) {
        next[key] = "";
      }
    });
    next.name = next.name.trim();
    return next;
  });
}
