/**
 * Fack API's — Route Matcher
 *
 * Powered by Radix3 (Radix Tree Router).
 * Provides high-performance O(K) route lookups for incoming concrete HTTP request
 * paths against user-defined route patterns stored in the database.
 *
 * Key responsibilities:
 * - Compile route patterns (static, parameterized e.g., `/users/:id`, and wildcards `/*path`) into a radix tree
 * - Match incoming paths in O(K) lookup time
 * - Extract named path parameters (e.g., `{ id: "123" }`)
 * - Cache compiled routers per route list snapshot for maximum throughput
 *
 * @see https://github.com/unjs/radix3
 */

import { createRouter } from "radix3";
import { LRUCache } from "lru-cache";
import type { Route } from "@/db/schema";

// ─── Types ───────────────────────────────────────────────────────────────────

/** A user-defined route with its metadata, as stored in the database */
export interface RouteDefinition extends Omit<Route, "path"> {
  path: string;
}

/** The result of a successful route match */
export interface RouteMatchResult {
  /** The matched route definition from the database */
  route: RouteDefinition;
  /** Extracted path parameters (e.g., { userId: "123", docId: "456" }) */
  params: Record<string, string | string[]>;
}

interface MatchTarget {
  routeId: string;
  wildcardKeys: string[];
}

interface CompiledMatcher {
  router: ReturnType<typeof createRouter<MatchTarget>>;
  routeMap: Map<string, RouteDefinition>;
}

type GlobalWithMatcherCache = typeof globalThis & {
  __fackApiMatcherCache?: LRUCache<string, CompiledMatcher>;
};

/**
 * Compiled-matcher cache, anchored to `globalThis` so that every Next.js
 * bundle in the process shares (and can clear) a single instance.
 */
const matcherCache: LRUCache<string, CompiledMatcher> = (() => {
  const globalScope = globalThis as GlobalWithMatcherCache;
  globalScope.__fackApiMatcherCache ??= new LRUCache<string, CompiledMatcher>({
    max: 500,
  });
  return globalScope.__fackApiMatcherCache;
})();

function getMatcherCacheKey(routes: RouteDefinition[], method: string): string {
  return `${method}:${routes
    .map(
      (route) =>
        `${route.id}:${route.path}:${route.method}:${route.updatedAt?.getTime() ?? ""}`,
    )
    .join("|")}`;
}

function compileMatcher(
  routes: RouteDefinition[],
  method: string,
): CompiledMatcher | null {
  const methodRoutes = routes.filter(
    (route) => route.method.toUpperCase() === method,
  );
  if (methodRoutes.length === 0) return null;

  const cacheKey = getMatcherCacheKey(methodRoutes, method);
  const cached = matcherCache.get(cacheKey);
  if (cached) return cached;

  const router = createRouter<MatchTarget>({ strictTrailingSlash: false });
  const routeMap = new Map<string, RouteDefinition>();

  for (const route of methodRoutes) {
    routeMap.set(route.id, route);
    let radixPath = route.path;
    const wildcardKeys: string[] = [];

    if (radixPath.includes("/*")) {
      radixPath = radixPath.replace(/\/\*([a-zA-Z0-9_]+)/g, (_, name) => {
        wildcardKeys.push(name);
        return `/**:${name}`;
      });
    }

    try {
      router.insert(radixPath, { routeId: route.id, wildcardKeys });
    } catch (error) {
      console.warn(`[fack-api] Invalid route pattern "${route.path}":`, error);
    }
  }

  const compiled = { router, routeMap };
  matcherCache.set(cacheKey, compiled);
  return compiled;
}

// ─── Public API ──────────────────────────────────────────────────────────────

/**
 * Finds the first matching route for a given HTTP method and path using Radix Tree matching.
 *
 * @param routes - Array of route definitions from the database
 * @param method - The HTTP method of the incoming request (e.g., "GET")
 * @param path - The concrete request path (e.g., "/users/123/posts")
 * @returns The matched route and extracted params, or null if no match
 */
export function findMatchingRoute(
  routes: RouteDefinition[],
  method: string,
  path: string,
): RouteMatchResult | null {
  const upperMethod = method.toUpperCase();
  const compiled = compileMatcher(routes, upperMethod);
  if (!compiled) return null;

  const matched = compiled.router.lookup(path);
  if (!matched) return null;

  const matchedRoute = compiled.routeMap.get(matched.routeId);
  if (!matchedRoute) return null;

  const params: Record<string, string | string[]> = {};
  if (matched.params) {
    for (const [key, val] of Object.entries(matched.params)) {
      if (typeof val === "string" && matched.wildcardKeys.includes(key)) {
        params[key] = val.split("/").filter(Boolean);
      } else if (typeof val === "string") {
        try {
          params[key] = decodeURIComponent(val);
        } catch {
          params[key] = val;
        }
      }
    }
  }

  return {
    route: matchedRoute,
    params,
  };
}

/**
 * Clears the compiled router cache.
 * Useful when routes are modified and cached matchers may be stale.
 */
export function clearMatcherCache(): void {
  matcherCache.clear();
}
