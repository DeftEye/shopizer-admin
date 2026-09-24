import { ApiError } from "@/lib/api/client";
import { ALPHANUMERIC } from "@/lib/constants";

import type { OptionDescription } from "./options-types";

export function isAlphanumeric(value: string): boolean {
  return ALPHANUMERIC.test(value);
}

export function nameFromDescriptions(
  descriptions: OptionDescription[] | undefined,
  lang: string,
): string {
  const match = descriptions?.find((item) => item.language === lang);
  return match?.name ?? "";
}

export function joinNames(items?: Array<{ name?: string }> | null): string {
  if (!items) {
    return "";
  }
  return items
    .map((item) => item.name)
    .filter((name): name is string => !!name)
    .join(", ");
}

export function readApiErrorMessage(error: unknown, fallback: string): string {
  if (error instanceof ApiError) {
    const body = error.body;
    if (typeof body === "string" && body.trim()) {
      return body;
    }
    if (body && typeof body === "object" && "message" in body) {
      const message = (body as { message?: unknown }).message;
      if (typeof message === "string" && message.trim()) {
        return message;
      }
    }
  }
  if (error instanceof Error && error.message) {
    return error.message;
  }
  return fallback;
}

/** Angular `PaginatorComponent.getPages`. */
export function visiblePages(
  currentPage: number,
  count: number,
  perPage: number,
  pagesToShow = 5,
): number[] {
  const total = Math.ceil(count / perPage) || 0;
  const current = currentPage || 1;
  const pages: number[] = [current];
  const times = pagesToShow - 1;
  for (let i = 0; i < times; i += 1) {
    if (pages.length < pagesToShow && Math.min(...pages) > 1) {
      pages.push(Math.min(...pages) - 1);
    }
    if (pages.length < pagesToShow && Math.max(...pages) < total) {
      pages.push(Math.max(...pages) + 1);
    }
  }
  return pages.sort((a, b) => a - b);
}

export function pageRange(
  currentPage: number,
  perPage: number,
  count: number,
): { min: number; max: number } {
  const min = perPage * currentPage - perPage + 1;
  const max = Math.min(perPage * currentPage, count);
  return { min, max };
}
