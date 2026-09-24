export type CategoryDescription = {
  language: string;
  name: string;
  highlights: string;
  friendlyUrl: string;
  description: string;
  title: string;
  metaDescription: string;
};

export type CategoryParent = {
  id: number;
  code: string;
};

export type CategoryNode = {
  id: number;
  code: string;
  store?: string;
  visible?: boolean;
  sortOrder?: number | string;
  name?: string;
  parent?: CategoryParent | null;
  description?: {
    name?: string;
    title?: string;
    description?: string;
  };
  descriptions?: Partial<CategoryDescription>[];
  children?: CategoryNode[];
};

export type CategoryListResponse = {
  categories?: CategoryNode[];
  recordsTotal?: number;
};

export type CategoryDetail = CategoryNode & {
  descriptions?: Partial<CategoryDescription>[];
};

export type CategoryFormState = {
  parent: string;
  store: string;
  visible: boolean;
  code: string;
  sortOrder: string;
  selectedLanguage: string;
  descriptions: CategoryDescription[];
};

export type CategoryPayload = {
  parent: CategoryParent;
  store: string;
  visible: boolean;
  code: string;
  sortOrder: string;
  selectedLanguage: string;
  descriptions: CategoryDescription[];
};

export type UniqueCodeResponse = {
  exists?: boolean;
};

export type StoreName = {
  code?: string;
};

export type StoreLanguage = {
  code: string;
  name?: string;
};
