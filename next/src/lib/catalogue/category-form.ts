import { ALPHANUMERIC_WITH_HYPHEN, NUMBER_PATTERN } from "./constants";
import type {
  CategoryDescription,
  CategoryDetail,
  CategoryFormState,
  CategoryNode,
  CategoryParent,
  CategoryPayload,
} from "./types";

export function emptyDescription(language: string): CategoryDescription {
  return {
    language,
    name: "",
    highlights: "",
    friendlyUrl: "",
    description: "",
    title: "",
    metaDescription: "",
  };
}

export function emptyCategoryForm(lang: string, store: string): CategoryFormState {
  return {
    parent: "root",
    store,
    visible: false,
    code: "",
    sortOrder: "0",
    selectedLanguage: lang,
    descriptions: [],
  };
}

export function flattenCategoryTree(nodes: CategoryNode[]): CategoryNode[] {
  const out: CategoryNode[] = [];
  const walk = (node: CategoryNode) => {
    out.push({
      ...node,
      name: node.description?.name ?? node.name ?? "",
    });
    node.children?.forEach(walk);
  };
  nodes.forEach(walk);
  return out;
}

export function parentOptions(
  nodes: CategoryNode[],
  excludeId?: number,
): CategoryNode[] {
  const withRoot: CategoryNode[] = [
    ...nodes,
    { id: 0, code: "root", children: [] },
  ];
  return flattenCategoryTree(withRoot)
    .filter((node) => node.id !== excludeId)
    .sort((a, b) => {
      if (a.code < b.code) {
        return -1;
      }
      if (a.code > b.code) {
        return 1;
      }
      return 0;
    });
}

export function formFromCategory(
  category: CategoryDetail,
  languages: Array<{ code: string }>,
  lang: string,
  merchant: string,
): CategoryFormState {
  const form = emptyCategoryForm(lang, category.store ?? merchant);
  form.parent = category.parent?.code ?? "root";
  form.visible = !!category.visible;
  form.code = category.code ?? "";
  form.sortOrder =
    category.sortOrder == null ? "0" : String(category.sortOrder);
  form.descriptions = languages.map((language) => {
    const match = category.descriptions?.find(
      (description) => description.language === language.code,
    );
    return {
      ...emptyDescription(language.code),
      name: match?.name ?? "",
      highlights: match?.highlights ?? "",
      friendlyUrl: match?.friendlyUrl ?? "",
      description: match?.description ?? "",
      title: match?.title ?? "",
      metaDescription: match?.metaDescription ?? "",
    };
  });
  return form;
}

export function invalidCategoryControls(form: CategoryFormState): string[] {
  const invalid: string[] = [];
  if (!form.parent) {
    invalid.push("parent");
  }
  if (!form.code || !ALPHANUMERIC_WITH_HYPHEN.test(form.code)) {
    invalid.push("code");
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
};

export function collectDescriptionDefaults(
  descriptions: CategoryDescription[],
): DescriptionDefaults {
  const defaults: DescriptionDefaults = {
    name: "",
    friendlyUrl: "",
  };

  for (const description of descriptions) {
    if (defaults.name === "" && description.name !== "") {
      defaults.name = description.name;
    }
    if (defaults.friendlyUrl === "" && description.friendlyUrl !== "") {
      defaults.friendlyUrl = description.friendlyUrl;
    }
    for (const key of Object.keys(description) as Array<
      keyof CategoryDescription
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
  descriptions: CategoryDescription[],
  defaults: DescriptionDefaults,
): CategoryDescription[] {
  return descriptions.map((description) => {
    const next: CategoryDescription = { ...description };
    (Object.keys(next) as Array<keyof CategoryDescription>).forEach((key) => {
      if (next[key] === "" && defaults[key]) {
        next[key] = defaults[key];
      }
      if (typeof next[key] === "undefined") {
        next[key] = "";
      }
      if (key === "name") {
        next.name = next.name.trim();
      }
    });
    return next;
  });
}

export function resolveParent(
  roots: CategoryNode[],
  parentCode: string,
): CategoryParent {
  const match = roots.find((item) => item.code === parentCode);
  if (!match) {
    return { id: 0, code: "root" };
  }
  return { id: match.id, code: match.code };
}

export function buildCategoryPayload(
  form: CategoryFormState,
  roots: CategoryNode[],
  merchant: string,
  isSuperAdmin: boolean,
): {
  payload: CategoryPayload;
  missing: string[];
  requiredMissing: boolean;
} {
  const missing = invalidCategoryControls(form);
  const defaults = collectDescriptionDefaults(form.descriptions);
  const requiredMissing =
    defaults.name === "" || defaults.friendlyUrl === "" || form.code === "";
  const descriptions = fillEmptyDescriptions(form.descriptions, defaults);

  return {
    payload: {
      parent: resolveParent(roots, form.parent),
      store: isSuperAdmin ? form.store : merchant,
      visible: form.visible,
      code: form.code,
      sortOrder: form.sortOrder,
      selectedLanguage: form.selectedLanguage,
      descriptions,
    },
    missing,
    requiredMissing,
  };
}

export function isDescendant(nodes: CategoryNode[], ancestorId: number, id: number): boolean {
  const ancestor = findNode(nodes, ancestorId);
  if (!ancestor) {
    return false;
  }
  return !!findNode(ancestor.children ?? [], id);
}

export function findNode(
  nodes: CategoryNode[],
  id: number,
): CategoryNode | null {
  for (const node of nodes) {
    if (node.id === id) {
      return node;
    }
    const child = findNode(node.children ?? [], id);
    if (child) {
      return child;
    }
  }
  return null;
}

export function moveCategoryNode(
  nodes: CategoryNode[],
  childId: number,
  parentId: number,
): CategoryNode[] {
  if (childId === parentId || isDescendant(nodes, childId, parentId)) {
    return nodes;
  }
  const { node, rest } = takeNode(nodes, childId);
  if (!node) {
    return nodes;
  }
  return insertChild(rest, parentId, node);
}

function takeNode(
  nodes: CategoryNode[],
  id: number,
): { node: CategoryNode | null; rest: CategoryNode[] } {
  let extracted: CategoryNode | null = null;
  const rest = nodes.flatMap((item) => {
    if (item.id === id) {
      extracted = item;
      return [];
    }
    const nested = takeNode(item.children ?? [], id);
    if (nested.node) {
      extracted = nested.node;
    }
    return [{ ...item, children: nested.rest }];
  });
  return { node: extracted, rest };
}

function insertChild(
  nodes: CategoryNode[],
  parentId: number,
  child: CategoryNode,
): CategoryNode[] {
  if (parentId === -1 || parentId === 0) {
    return [...nodes, { ...child, parent: null }];
  }
  return nodes.map((item) => {
    if (item.id === parentId) {
      return {
        ...item,
        children: [...(item.children ?? []), child],
      };
    }
    return {
      ...item,
      children: item.children ? insertChild(item.children, parentId, child) : [],
    };
  });
}

export function decorateHierarchy(nodes: CategoryNode[]): CategoryNode[] {
  return nodes.map((node) => ({
    ...node,
    name: node.description?.name ?? node.name ?? "",
    title: node.description?.title,
    children: node.children ? decorateHierarchy(node.children) : [],
  }));
}
