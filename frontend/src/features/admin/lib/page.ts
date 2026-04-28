import type { Page } from "../types";

export function buildQuery(params: Record<string, string | number | undefined>) {
  const searchParams = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== "") {
      searchParams.set(key, String(value));
    }
  }
  return searchParams.toString();
}

export function toPageTotals<T>(pageData: Page<T>) {
  return {
    totalPages: Math.max(pageData.page?.totalPages ?? 1, 1),
    totalElements: pageData.page?.totalElements ?? pageData.content.length,
  };
}
