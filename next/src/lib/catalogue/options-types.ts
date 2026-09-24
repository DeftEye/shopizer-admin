export type OptionDescription = {
  id?: number;
  language: string;
  name: string;
  description?: string;
};

export type ProductOption = {
  id?: number;
  code: string;
  type: string;
  order?: number;
  descriptions?: OptionDescription[];
  description?: OptionDescription;
  readOnly?: boolean;
};

export type ProductOptionValue = {
  id?: number;
  code: string;
  order?: number;
  defaultValue?: boolean;
  descriptions?: OptionDescription[];
  description?: OptionDescription;
  image?: string;
  price?: string;
  sortOrder?: number;
};

export type OptionListResponse = {
  options?: ProductOption[];
  recordsTotal?: number;
};

export type OptionValueListResponse = {
  optionValues?: ProductOptionValue[];
  recordsTotal?: number;
};

export type NamedRef = {
  id: number;
  name?: string;
  code?: string;
};

export type OptionSet = {
  id?: number;
  code: string;
  option?: NamedRef;
  values?: NamedRef[];
  productTypes?: NamedRef[];
  readOnly?: boolean;
};

export type OptionSetWrite = {
  readOnly: boolean;
  code?: string;
  option: number | string;
  optionValues: Array<number | string>;
  productTypes: Array<number | string>;
};

export type Variation = {
  id?: number;
  code: string;
  option?: NamedRef;
  values?: NamedRef[];
};

export type VariationListResponse = {
  items?: Variation[];
};

export type VariationWrite = {
  code: string;
  option: number | string;
  optionValue: number | string;
};

export type ProductType = {
  id: number;
  code: string;
  name?: string;
};

export type ProductTypeListResponse = {
  list?: ProductType[];
};

export type UniqueResponse = {
  exists: boolean;
};

export type OptionWrite = {
  id?: number;
  code: string;
  type: string;
  selectedLanguage: string;
  descriptions: OptionDescription[];
};

export type OptionValueWrite = {
  id?: number;
  code: string;
  selectedLanguage: string;
  descriptions: OptionDescription[];
};

export type OptionsListParams = {
  store?: string;
  lang?: string;
  count?: number;
  page?: number;
  name?: string;
};

export const OPTION_TYPES = ["select", "radio", "checkbox", "text"] as const;

export const OPTIONS_PER_PAGE = 15;
