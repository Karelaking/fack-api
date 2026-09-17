/**
 * Fack API's — In-Memory Cache Layer
 *
 * Implements a high-performance, bounded in-memory cache using LRUCache.
 * Applies Object-Oriented principles (Singleton, Strategy) to provide:
 * - Bounded memory consumption with explicit max item limits
 * - Configurable Time-To-Live (TTL) expiration per data category
 * - Granular invalidation (per project, per route) instead of global cache nuking
 * - Full backward compatibility with existing procedural function exports
 */

import { LRUCache } from "lru-cache";
import type { Project, Route } from "@/db/schema";
import { LoggerRegistry } from "@/lib/logger-registry";

const cacheTrace = LoggerRegistry.getTrace("cache");

export interface PageCacheEntry {
  page: number;
  limit: number;
  items: unknown[];
}

/**
 * CacheManager manages separate bounded LRU caches for different entity domains.
 */
export class CacheManager {
  private static instance: CacheManager | undefined;

  private projectListCache: LRUCache<string, Project[]>;
  private projectBySlugCache: LRUCache<string, Project>;
  private projectRoutesCache: LRUCache<string, Route[]>;
  private routeMockDataCache: LRUCache<string, unknown[]>;
  private routeSingleMockDataCache: LRUCache<string, NonNullable<unknown>>;
  private routePageCache: LRUCache<string, PageCacheEntry[]>;

  private constructor() {
    // Projects list cache: 10 minute TTL, max 50 entries
    this.projectListCache = new LRUCache<string, Project[]>({
      max: 50,
      ttl: 10 * 60 * 1000,
    });

    // Project by slug cache: 10 minute TTL, max 500 entries
    this.projectBySlugCache = new LRUCache<string, Project>({
      max: 500,
      ttl: 10 * 60 * 1000,
    });

    // Routes by project cache: 5 minute TTL, max 1,000 entries
    this.projectRoutesCache = new LRUCache<string, Route[]>({
      max: 1000,
      ttl: 5 * 60 * 1000,
    });

    // Route mock data array cache: 5 minute TTL, max 2,000 entries
    this.routeMockDataCache = new LRUCache<string, unknown[]>({
      max: 2000,
      ttl: 5 * 60 * 1000,
    });

    // Single route mock object cache: 5 minute TTL, max 2,000 entries
    this.routeSingleMockDataCache = new LRUCache<string, NonNullable<unknown>>({
      max: 2000,
      ttl: 5 * 60 * 1000,
    });

    // Paged route cache: 5 minute TTL, max 2,000 entries
    this.routePageCache = new LRUCache<string, PageCacheEntry[]>({
      max: 2000,
      ttl: 5 * 60 * 1000,
    });
  }

  /**
   * Singleton accessor for CacheManager.
   */
  public static getInstance(): CacheManager {
    if (!CacheManager.instance) {
      CacheManager.instance = new CacheManager();
    }
    return CacheManager.instance;
  }

  // ── Projects List ────────────────────────────────────────────────────────

  public getProjectsList(): Project[] | undefined {
    return this.projectListCache.get("all_projects");
  }

  public setProjectsList(projects: Project[]): void {
    this.projectListCache.set("all_projects", projects);
  }

  // ── Project by Slug ──────────────────────────────────────────────────────

  public getProjectBySlug(slug: string): Project | undefined {
    return this.projectBySlugCache.get(slug);
  }

  public setProjectBySlug(slug: string, project: Project): void {
    this.projectBySlugCache.set(slug, project);
  }

  // ── Project Routes ───────────────────────────────────────────────────────

  public getRoutes(projectId: string): Route[] | undefined {
    return this.projectRoutesCache.get(projectId);
  }

  public setRoutes(projectId: string, routes: Route[]): void {
    this.projectRoutesCache.set(projectId, routes);
  }

  // ── Route Mock Data ──────────────────────────────────────────────────────

  public getMockData(routeId: string): unknown[] | undefined {
    return this.routeMockDataCache.get(routeId);
  }

  public setMockData(routeId: string, data: unknown[]): void {
    this.routeMockDataCache.set(routeId, data);
  }

  public getSingleMockData(routeId: string): unknown | undefined {
    return this.routeSingleMockDataCache.get(routeId);
  }

  public setSingleMockData(routeId: string, data: unknown): void {
    if (data !== undefined && data !== null) {
      this.routeSingleMockDataCache.set(routeId, data as NonNullable<unknown>);
    }
  }

  // ── Page Data ────────────────────────────────────────────────────────────

  public getPageData(
    routeId: string,
    page: number,
    limit: number,
  ): unknown[] | undefined {
    const entries = this.routePageCache.get(routeId);
    if (!entries) return undefined;
    const entry = entries.find((e) => e.page === page && e.limit === limit);
    return entry?.items;
  }

  public setPageData(
    routeId: string,
    page: number,
    limit: number,
    items: unknown[],
  ): void {
    const entries = this.routePageCache.get(routeId) ?? [];
    const filtered = entries.filter(
      (e) => !(e.page === page && e.limit === limit),
    );
    filtered.push({ page, limit, items });
    this.routePageCache.set(routeId, filtered);
  }

  public prunePageData(
    routeId: string,
    currentPage: number,
    limit: number,
  ): void {
    const entries = this.routePageCache.get(routeId) ?? [];
    const pruned = entries.filter(
      (e) =>
        e.limit !== limit ||
        e.page === currentPage - 1 ||
        e.page === currentPage ||
        e.page === currentPage + 1,
    );
    this.routePageCache.set(routeId, pruned);
  }

  // ── Invalidation ─────────────────────────────────────────────────────────

  /**
   * Granularly invalidates cached data for a specific project.
   */
  public invalidateProject(projectId: string, projectSlug?: string): void {
    this.projectRoutesCache.delete(projectId);
    this.projectListCache.delete("all_projects");
    if (projectSlug) {
      this.projectBySlugCache.delete(projectSlug);
    }
  }

  /**
   * Granularly invalidates cached mock payloads for a specific route.
   */
  public invalidateRoute(routeId: string): void {
    this.routeMockDataCache.delete(routeId);
    this.routeSingleMockDataCache.delete(routeId);
    this.routePageCache.delete(routeId);
  }

  /**
   * Clears all caches across all domains.
   */
  public clearAll(): void {
    this.projectListCache.clear();
    this.projectBySlugCache.clear();
    this.projectRoutesCache.clear();
    this.routeMockDataCache.clear();
    this.routeSingleMockDataCache.clear();
    this.routePageCache.clear();
  }
}

// ── Backward-Compatible Functional Facade ────────────────────────────────────

const cacheManager = CacheManager.getInstance();

export function getCachedProjectsList(): Project[] | undefined {
  cacheTrace.traceCall("getCachedProjectsList");
  const res = cacheManager.getProjectsList();
  cacheTrace.traceSuccess(
    "getCachedProjectsList",
    res ? `${res.length} projects` : "undefined",
  );
  return res;
}

export function setCachedProjectsList(projects: Project[]): void {
  cacheTrace.traceCall("setCachedProjectsList", `${projects.length} projects`);
  cacheManager.setProjectsList(projects);
  cacheTrace.traceSuccess("setCachedProjectsList", "void");
}

export function getCachedProjectBySlug(slug: string): Project | undefined {
  cacheTrace.traceCall("getCachedProjectBySlug", slug);
  const res = cacheManager.getProjectBySlug(slug);
  cacheTrace.traceSuccess(
    "getCachedProjectBySlug",
    res ? res.name : "undefined",
  );
  return res;
}

export function setCachedProjectBySlug(slug: string, project: Project): void {
  cacheTrace.traceCall("setCachedProjectBySlug", slug, project.name);
  cacheManager.setProjectBySlug(slug, project);
  cacheTrace.traceSuccess("setCachedProjectBySlug", "void");
}

export function getCachedRoutes(projectId: string): Route[] | undefined {
  cacheTrace.traceCall("getCachedRoutes", projectId);
  const res = cacheManager.getRoutes(projectId);
  cacheTrace.traceSuccess(
    "getCachedRoutes",
    res ? `${res.length} routes` : "undefined",
  );
  return res;
}

export function setCachedRoutes(projectId: string, routes: Route[]): void {
  cacheTrace.traceCall("setCachedRoutes", projectId, `${routes.length} routes`);
  cacheManager.setRoutes(projectId, routes);
  cacheTrace.traceSuccess("setCachedRoutes", "void");
}

export function getCachedMockData(routeId: string): unknown[] | undefined {
  cacheTrace.traceCall("getCachedMockData", routeId);
  const res = cacheManager.getMockData(routeId);
  cacheTrace.traceSuccess(
    "getCachedMockData",
    res ? `${res.length} objects` : "undefined",
  );
  return res;
}

export function setCachedMockData(routeId: string, data: unknown[]): void {
  cacheTrace.traceCall("setCachedMockData", routeId, `${data.length} objects`);
  cacheManager.setMockData(routeId, data);
  cacheTrace.traceSuccess("setCachedMockData", "void");
}

export function getCachedSingleMockData(routeId: string): unknown | undefined {
  cacheTrace.traceCall("getCachedSingleMockData", routeId);
  const res = cacheManager.getSingleMockData(routeId);
  cacheTrace.traceSuccess(
    "getCachedSingleMockData",
    res ? "object" : "undefined",
  );
  return res;
}

export function setCachedSingleMockData(routeId: string, data: unknown): void {
  cacheTrace.traceCall("setCachedSingleMockData", routeId);
  cacheManager.setSingleMockData(routeId, data);
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
  const res = cacheManager.getPageData(routeId, page, limit);
  cacheTrace.traceSuccess(
    "getCachedPageData",
    res ? `hit (${res.length} items)` : "miss",
  );
  return res;
}

export function setCachedPageData(
  routeId: string,
  page: number,
  limit: number,
  items: unknown[],
): void {
  cacheTrace.traceCall(
    "setCachedPageData",
    routeId,
    `page: ${page}`,
    `limit: ${limit}`,
    `${items.length} items`,
  );
  cacheManager.setPageData(routeId, page, limit, items);
  cacheTrace.traceSuccess("setCachedPageData", "void");
}

export function prunePageCache(
  routeId: string,
  currentPage: number,
  limit: number,
): void {
  cacheTrace.traceCall(
    "prunePageCache",
    routeId,
    `currentPage: ${currentPage}`,
    `limit: ${limit}`,
  );
  cacheManager.prunePageData(routeId, currentPage, limit);
  cacheTrace.traceSuccess("prunePageCache", "void");
}

export function clearCache(): void {
  cacheTrace.traceCall("clearCache");
  cacheManager.clearAll();
  cacheTrace.traceSuccess("clearCache", "void");
}

export function clearProjectCache(
  projectId: string,
  projectSlug?: string,
): void {
  cacheTrace.traceCall("clearProjectCache", projectId);
  cacheManager.invalidateProject(projectId, projectSlug);
  cacheTrace.traceSuccess("clearProjectCache", "void");
}

export function clearRouteCache(routeId: string): void {
  cacheTrace.traceCall("clearRouteCache", routeId);
  cacheManager.invalidateRoute(routeId);
  cacheTrace.traceSuccess("clearRouteCache", "void");
}
