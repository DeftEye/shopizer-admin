import { client } from "@/lib/api/client";
import type { Language } from "@/lib/api/types";
import { getLang, getMerchant } from "@/lib/auth/session";

import type {
  OptionListResponse,
  OptionSet,
  OptionSetWrite,
  OptionValueListResponse,
  OptionValueWrite,
  OptionWrite,
  OptionsListParams,
  ProductOption,
  ProductOptionValue,
  ProductTypeListResponse,
  UniqueResponse,
  VariationListResponse,
  VariationWrite,
} from "./options-types";

export function sessionListParams(
  extras: Partial<OptionsListParams> = {},
): OptionsListParams {
  return {
    store: getMerchant() ?? "",
    lang: getLang(),
    ...extras,
  };
}

export function listOptions(
  params: OptionsListParams,
): Promise<OptionListResponse> {
  return client.get("/v1/private/product/options", params) as Promise<OptionListResponse>;
}

export function getOptionById(id: string | number): Promise<ProductOption> {
  return client.get(`/v1/private/product/option/${id}`, {
    lang: "_all",
  }) as Promise<ProductOption>;
}

export function createOption(option: OptionWrite): Promise<ProductOption> {
  return client.post("/v1/private/product/option", option) as Promise<ProductOption>;
}

export function updateOption(
  id: string | number,
  option: OptionWrite,
): Promise<unknown> {
  return client.put(`/v1/private/product/option/${id}`, option);
}

export function deleteOption(id: string | number): Promise<unknown> {
  return client.delete(`/v1/private/product/option/${id}`);
}

export function checkOptionCode(code: string): Promise<UniqueResponse> {
  return client.get("/v1/private/product/option/unique", {
    code,
  }) as Promise<UniqueResponse>;
}

export function listOptionValues(
  params: OptionsListParams,
): Promise<OptionValueListResponse> {
  return client.get(
    "/v1/private/product/options/values",
    params,
  ) as Promise<OptionValueListResponse>;
}

export function getOptionValueById(
  id: string | number,
): Promise<ProductOptionValue> {
  return client.get(`/v1/private/product/option/value/${id}`, {
    lang: "_all",
  }) as Promise<ProductOptionValue>;
}

export function createOptionValue(
  option: OptionValueWrite,
): Promise<ProductOptionValue> {
  return client.post(
    "/v1/private/product/option/value",
    option,
  ) as Promise<ProductOptionValue>;
}

export function updateOptionValue(
  id: string | number,
  option: OptionValueWrite,
): Promise<unknown> {
  return client.put(`/v1/private/product/option/value/${id}`, option);
}

export function deleteOptionValue(id: string | number): Promise<unknown> {
  return client.delete(`/v1/private/product/option/value/${id}`);
}

export function checkOptionValueCode(code: string): Promise<UniqueResponse> {
  return client.get("/v1/private/product/option/value/unique", {
    code,
  }) as Promise<UniqueResponse>;
}

export function createOptionValueImage(
  optionValueId: string | number,
  file: File,
): Promise<unknown> {
  const body = new FormData();
  body.append("file", file, file.name);
  return client.post(
    `/v1/private/product/option/value/${optionValueId}/image`,
    body,
  );
}

export function deleteOptionValueImage(
  optionValueId: string | number,
): Promise<unknown> {
  return client.delete(`/v1/private/product/option/value/${optionValueId}/image`);
}

export function listOptionSets(): Promise<OptionSet[]> {
  return client.get("/v1/private/product/property/set", {
    store: getMerchant() ?? "",
    lang: getLang(),
  }) as Promise<OptionSet[]>;
}

export function getOptionSetById(id: string | number): Promise<OptionSet> {
  return client.get(`/v1/private/product/property/set/${id}`, {
    store: getMerchant() ?? "",
    lang: getLang(),
  }) as Promise<OptionSet>;
}

export function createOptionSet(body: OptionSetWrite): Promise<unknown> {
  return client.post("/v1/private/product/property/set", body, {
    params: {
      store: getMerchant() ?? "",
      lang: getLang(),
    },
  });
}

export function updateOptionSet(
  id: string | number,
  body: OptionSetWrite,
): Promise<unknown> {
  return client.put(`/v1/private/product/property/set/${id}`, body, {
    params: {
      store: getMerchant() ?? "",
      lang: getLang(),
    },
  });
}

export function deleteOptionSet(id: string | number): Promise<unknown> {
  return client.delete(`/v1/private/product/property/set/${id}`, {
    params: {
      store: getMerchant() ?? "",
      lang: getLang(),
    },
  });
}

export function checkOptionSetCode(code: string): Promise<UniqueResponse> {
  return client.get(
    `/v1/private/product/property/set/unique?code=${code}`,
  ) as Promise<UniqueResponse>;
}

export function listVariations(): Promise<VariationListResponse> {
  return client.get(
    "/v2/private/product/variation",
  ) as Promise<VariationListResponse>;
}

export function createVariation(body: VariationWrite): Promise<unknown> {
  return client.post("/v2/private/product/variation", body);
}

export function checkVariationCode(code: string): Promise<UniqueResponse> {
  return client.get("/v2/private/product/variation/unique", {
    code,
  }) as Promise<UniqueResponse>;
}

export function listProductTypes(): Promise<ProductTypeListResponse> {
  return client.get("/v1/private/products/types", {
    store: getMerchant() ?? "",
    lang: getLang(),
  }) as Promise<ProductTypeListResponse>;
}

export function listStoreLanguages(store: string): Promise<Language[]> {
  return client.get("/v1/store/languages", { store }) as Promise<Language[]>;
}

export function listSystemLanguages(): Promise<Language[]> {
  return client.get("/v1/languages") as Promise<Language[]>;
}

export function listStoreCodes(): Promise<string[]> {
  return (
    client.get("/v1/private/stores", { code: "DEFAULT" }) as Promise<{
      data?: Array<{ code?: string }>;
    }>
  ).then((res) =>
    (res.data ?? [])
      .map((store) => store.code)
      .filter((code): code is string => !!code),
  );
}
