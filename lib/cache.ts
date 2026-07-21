import type { Project, Route } from "@/db/schema";
import { LoggerRegistry } from "@/lib/logger-registry";

const cacheTrace = LoggerRegistry.getTrace("cache");

const projectListCache = new Map<string, Project[]>();
const projectBySlugCache = new Map<string, Project>();
const projectRoutesCache = new Map<string, Route[]>();
const routeMockDataCache = new Map<string, unknown[]>();
const routeSingleMockDataCache = new Map<string, unknown>();

export interface PageCacheEntry {
  page: number;
  limit: number;
  items: unknown[];
}

const routePageCache = new Map<string, PageCacheEntry[]>();

export function getCachedProjectsList(): Project[] | undefined {
  cacheTrace.traceCall("getCachedProjectsList");
  const res = projectListCache.get("all_projects");
  cacheTrace.traceSuccess(
    "getCachedProjectsList",
    res ? `${res.length} projects` : "undefined",
  );
  return res;
}

export function setCachedProjectsList(projects: Project[]) {
  cacheTrace.traceCall("setCachedProjectsList", `${projects.length} projects`);
  projectListCache.set("all_projects", projects);
  cacheTrace.traceSuccess("setCachedProjectsList", "void");
}

export function getCachedProjectBySlug(slug: string): Project | undefined {
  cacheTrace.traceCall("getCachedProjectBySlug", slug);
  const res = projectBySlugCache.get(slug);
  cacheTrace.traceSuccess(
    "getCachedProjectBySlug",
    res ? res.name : "undefined",
  );
  return res;
}

export function setCachedProjectBySlug(slug: string, project: Project) {
  cacheTrace.traceCall("setCachedProjectBySlug", slug, project.name);
  projectBySlugCache.set(slug, project);
  cacheTrace.traceSuccess("setCachedProjectBySlug", "void");
}

export function getCachedRoutes(projectId: string): Route[] | undefined {
  cacheTrace.traceCall("getCachedRoutes", projectId);
  const res = projectRoutesCache.get(projectId);
  cacheTrace.traceSuccess(
    "getCachedRoutes",
    res ? `${res.length} routes` : "undefined",
  );
  return res;
}

export function setCachedRoutes(projectId: string, routes: Route[]) {
  cacheTrace.traceCall("setCachedRoutes", projectId, `${routes.length} routes`);
  projectRoutesCache.set(projectId, routes);
  cacheTrace.traceSuccess("setCachedRoutes", "void");
}

export function getCachedMockData(routeId: string): unknown[] | undefined {
  cacheTrace.traceCall("getCachedMockData", routeId);
  const res = routeMockDataCache.get(routeId);
  cacheTrace.traceSuccess(
    "getCachedMockData",
    res ? `${res.length} objects` : "undefined",
  );
  return res;
}

export function setCachedMockData(routeId: string, data: unknown[]) {
  cacheTrace.traceCall("setCachedMockData", routeId, `${data.length} objects`);
  routeMockDataCache.set(routeId, data);
  cacheTrace.traceSuccess("setCachedMockData", "void");
}

export function getCachedSingleMockData(routeId: string): unknown | undefined {
  cacheTrace.traceCall("getCachedSingleMockData", routeId);
  const res = routeSingleMockDataCache.get(routeId);
  cacheTrace.traceSuccess(
    "getCachedSingleMockData",
    res ? "object" : "undefined",
  );
  return res;
}

export function setCachedSingleMockData(routeId: string, data: unknown) {
  cacheTrace.traceCall("setCachedSingleMockData", routeId);
  routeSingleMockDataCache.set(routeId, data);
  cacheTrace.traceSuccess("setCachedSingleMockData", "void");
}

export function getCachedPageData(
  routeId: string,
  page: number,
  limit: number,
): unknown[] | undefined {
  cacheTrace.traceCall(
    "getCachedPageData",
    routeId,
    `page: ${page}`,
    `limit: ${limit}`,
  );
  const entries = routePageCache.get(routeId) || [];
  const entry = entries.find((e) => e.page === page && e.limit === limit);
  cacheTrace.traceSuccess(
    "getCachedPageData",
    entry ? `hit (${entry.items.length} items)` : "miss",
  );
  return entry?.items;
}

export function setCachedPageData(
  routeId: string,
  page: number,
  limit: number,
  items: unknown[],
) {
  cacheTrace.traceCall(
    "setCachedPageData",
    routeId,
    `page: ${page}`,
    `limit: ${limit}`,
    `${items.length} items`,
  );
  const entries = routePageCache.get(routeId) || [];
  const filtered = entries.filter(
    (e) => !(e.page === page && e.limit === limit),
  );
  filtered.push({ page, limit, items });
  routePageCache.set(routeId, filtered);
  cacheTrace.traceSuccess("setCachedPageData", "void");
}

export function prunePageCache(
  routeId: string,
  currentPage: number,
  limit: number,
) {
  cacheTrace.traceCall(
    "prunePageCache",
    routeId,
    `currentPage: ${currentPage}`,
    `limit: ${limit}`,
  );
  const entries = routePageCache.get(routeId) || [];
  const pruned = entries.filter(
    (e) =>
      e.limit !== limit ||
      e.page === currentPage - 1 ||
      e.page === currentPage ||
      e.page === currentPage + 1,
  );
  routePageCache.set(routeId, pruned);
  cacheTrace.traceSuccess("prunePageCache", `kept ${pruned.length} pages`);
}

export function clearCache() {
  cacheTrace.traceCall("clearCache");
  projectListCache.clear();
  projectBySlugCache.clear();
  projectRoutesCache.clear();
  routeMockDataCache.clear();
  routeSingleMockDataCache.clear();
  routePageCache.clear();
  cacheTrace.traceSuccess("clearCache", "void");
}
