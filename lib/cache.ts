import type { Project, Route } from "@/db/schema";
import { LoggerRegistry } from "@/lib/logger-registry";

const cacheTrace = LoggerRegistry.getTrace("cache");

const projectListCache = new Map<string, Project[]>();
const projectBySlugCache = new Map<string, Project>();
const projectRoutesCache = new Map<string, Route[]>();
const routeMockDataCache = new Map<string, unknown[]>();

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

export function clearCache() {
  cacheTrace.traceCall("clearCache");
  projectListCache.clear();
  projectBySlugCache.clear();
  projectRoutesCache.clear();
  routeMockDataCache.clear();
  cacheTrace.traceSuccess("clearCache", "void");
}
