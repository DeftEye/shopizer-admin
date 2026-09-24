import { ALPHANUMERIC_PATTERN, NUMBER_PATTERN } from "./constants";
import type {
  ProductDefinitionForm,
  ProductDefinitionPayload,
  ProductDescription,
  ProductDetail,
} from "./types";

export function emptyDescription(language: string): ProductDescription {
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

export function emptyProductForm(lang: string): ProductDefinitionForm {
  return {
    sku: "",
    visible: false,
    dateAvailable: todayDateInput(),
    manufacturer: "",
    type: "",
    display: true,
    canBePurchased: true,
    timeBound: false,
    price: "",
    quantity: "",
    sortOrder: "",
    productSpecifications: {
      weight: "",
      height: "",
      width: "",
      length: "",
    },
    selectedLanguage: lang,
    descriptions: [],
  };
}

export function todayDateInput(): string {
  return formatDateAvailable(new Date());
}

export function formatDateAvailable(value: string | Date): string {
  if (typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return value;
  }
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "";
  }
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function formFromProduct(
  product: ProductDetail,
  languages: Array<{ code: string }>,
  lang: string,
): ProductDefinitionForm {
  const form = emptyProductForm(lang);
  form.sku = product.sku ?? "";
  form.visible = !!product.visible;
  form.canBePurchased = product.canBePurchased !== false;
  form.dateAvailable = product.dateAvailable
    ? formatDateAvailable(product.dateAvailable)
    : todayDateInput();
  form.manufacturer = product.manufacturer?.code ?? "";
  form.type = product.type?.code ?? "";
  form.price = product.price == null ? "" : String(product.price);
  form.quantity = product.quantity == null ? "" : String(product.quantity);
  form.sortOrder = product.sortOrder == null ? "" : String(product.sortOrder);
  form.productSpecifications = {
    weight: String(product.productSpecifications?.weight ?? ""),
    height: String(product.productSpecifications?.height ?? ""),
    width: String(product.productSpecifications?.width ?? ""),
    length: String(product.productSpecifications?.length ?? ""),
  };
  form.descriptions = languages.map((language) => {
    const match = product.descriptions?.find(
      (description) => description.language === language.code,
    );
    return {
      ...emptyDescription(language.code),
      name: match?.name ?? "",
      highlights: match?.highlights ?? "",
      friendlyUrl: match?.friendlyUrl ?? "",
      description: match?.description ?? "",
      title: match?.title ?? "",
      keyWords: match?.keyWords ?? "",
      metaDescription: match?.metaDescription ?? "",
    };
  });
  return form;
}

export function invalidProductControls(form: ProductDefinitionForm): string[] {
  const invalid: string[] = [];
  if (!form.sku || !ALPHANUMERIC_PATTERN.test(form.sku)) {
    invalid.push("sku");
  }
  if (!form.manufacturer) {
    invalid.push("manufacturer");
  }
  if (!form.price) {
    invalid.push("price");
  }
  if (!form.quantity || !NUMBER_PATTERN.test(String(form.quantity))) {
    invalid.push("quantity");
  }
  if (!form.sortOrder || !NUMBER_PATTERN.test(String(form.sortOrder))) {
    invalid.push("sortOrder");
  }
  if (!form.selectedLanguage) {
    invalid.push("selectedLanguage");
  }
  if (
    form.descriptions.some(
      (description) => !description.name || !description.friendlyUrl,
    )
  ) {
    invalid.push("descriptions");
  }
  return invalid;
}

type DescriptionDefaults = Record<string, string> & {
  name: string;
  friendlyUrl: string;
  title: string;
  language: string;
};

export function collectDescriptionDefaults(
  descriptions: ProductDescription[],
  merchantCode: string,
): DescriptionDefaults {
  const defaults: DescriptionDefaults = {
    name: "",
    friendlyUrl: "",
    title: "",
    language: "",
  };

  for (const description of descriptions) {
    defaults.language = description.language;
    if (defaults.name === "" && description.name !== "") {
      defaults.name = description.name;
    }
    if (defaults.friendlyUrl === "" && description.friendlyUrl !== "") {
      defaults.friendlyUrl = description.friendlyUrl;
    }
    if (defaults.title === "" && description.title !== "") {
      defaults.title = description.title;
    }
    if (defaults.title === "" && description.title === "") {
      defaults.title = `${merchantCode} | ${description.name}`;
    }
    for (const key of Object.keys(description) as Array<
      keyof ProductDescription
    >) {
      const value = description[key];
      if (!(key in defaults) && value !== "") {
        defaults[key] = String(value);
      }
    }
  }

  return defaults;
}

export function fillEmptyDescriptions(
  descriptions: ProductDescription[],
  defaults: DescriptionDefaults,
): ProductDescription[] {
  return descriptions.map((description) => {
    const next: ProductDescription = { ...description };
    (Object.keys(next) as Array<keyof ProductDescription>).forEach((key) => {
      if (next[key] === "" && defaults[key]) {
        next[key] = defaults[key];
      }
      if (typeof next[key] === "undefined" || !next[key]) {
        if (key === "name") {
          next.name = next.name.trim();
        }
        next[key] = next[key] ? next[key] : "";
      }
    });
    return next;
  });
}

export function buildProductPayload(
  form: ProductDefinitionForm,
  merchantCode: string,
): {
  payload: ProductDefinitionPayload;
  missing: string[];
  requiredMissing: boolean;
} {
  const missing = invalidProductControls(form);
  const defaults = collectDescriptionDefaults(form.descriptions, merchantCode);
  const requiredMissing =
    defaults.name === "" ||
    defaults.friendlyUrl === "" ||
    form.sku === "" ||
    form.manufacturer === "";

  const descriptions = fillEmptyDescriptions(form.descriptions, defaults);
  const payload: ProductDefinitionPayload = {
    sku: form.sku,
    visible: form.visible,
    dateAvailable: formatDateAvailable(form.dateAvailable),
    manufacturer: form.manufacturer,
    type: form.type,
    display: form.display,
    canBePurchased: form.canBePurchased,
    timeBound: form.timeBound,
    price: form.price,
    quantity: form.quantity,
    sortOrder: form.sortOrder,
    productSpecifications: { ...form.productSpecifications },
    descriptions,
  };

  return { payload, missing, requiredMissing };
}

export function productListName(item: {
  name?: string;
  description?: { name?: string };
}): string {
  return item.description?.name || item.name || "";
}
