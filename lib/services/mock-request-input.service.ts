import type { CachedRoute } from "@/lib/cache";
import { LoggerRegistry } from "@/lib/logger-registry";

const inputLogger = LoggerRegistry.get("mock-core");

export interface PaginationInput {
  pageParam: string | null;
  limitParam: string | null;
  pageValue: number;
  limitValue?: number;
  isPagedRequest: boolean;
}

export function parseRouteSchema(route: CachedRoute): Record<string, unknown> {
  try {
    const parsed: unknown = JSON.parse(route.responseSchema ?? "{}");
    return parsed && typeof parsed === "object" && !Array.isArray(parsed)
      ? (parsed as Record<string, unknown>)
      : {};
  } catch {
    inputLogger.warn(`Invalid JSON schema for route ${route.id}`);
    return {};
  }
}

export function parseRouteHeaders(route: CachedRoute): Record<string, string> {
  try {
    const parsed: unknown = JSON.parse(route.customHeaders ?? "{}");
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
      return {};
    }
    return Object.fromEntries(
      Object.entries(parsed).filter(([, value]) => typeof value === "string"),
    );
  } catch {
    inputLogger.warn(`Invalid custom headers for route ${route.id}`);
    return {};
  }
}

export function parsePagination(
  searchParams: URLSearchParams,
): PaginationInput {
  const pageParam = searchParams.get("page") || searchParams.get("_page");
  const limitParam =
    searchParams.get("limit") ||
    searchParams.get("_limit") ||
    searchParams.get("count");

  const parsedPage = pageParam ? Number.parseInt(pageParam, 10) : NaN;
  const parsedLimit = limitParam ? Number.parseInt(limitParam, 10) : NaN;

  return {
    pageParam,
    limitParam,
    pageValue: Number.isInteger(parsedPage) && parsedPage > 0 ? parsedPage : 1,
    limitValue:
      Number.isInteger(parsedLimit) && parsedLimit > 0
        ? parsedLimit
        : undefined,
    isPagedRequest: pageParam !== null,
  };
}
