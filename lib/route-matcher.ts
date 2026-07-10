/**
 * Fack API's — Route Matcher
 *
 * Wraps the `path-to-regexp` library to match incoming concrete HTTP request
 * paths against user-defined Express-style route patterns stored in the database.
 *
 * This module is a critical component of the Data Plane. When a mock API request
 * arrives, the routing engine retrieves all configured routes for the project
 * and uses this matcher to find the correct route and extract path parameters.
 *
 * Key responsibilities:
 * - Compile Express-style patterns (e.g., `/users/:id`) into regex matchers
 * - Match incoming paths against compiled patterns
 * - Extract named path parameters (e.g., `{ id: "123" }`)
 * - Handle route priority (specific routes before parameterized ones)
 *
 * @see https://github.com/pillarjs/path-to-regexp
 */

import { match, type MatchFunction, type MatchResult } from "path-to-regexp";
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
  params: Record<string, string>;
}

// ─── Matcher Cache ───────────────────────────────────────────────────────────

/**
 * Cache of compiled match functions to avoid recompiling regex on every request.
 * Key is the route path pattern, value is the compiled match function.
 *
 * This cache lives for the lifetime of the server process. Since route patterns
 * change infrequently (only when users edit routes), this provides significant
 * performance improvement for high-throughput mock API usage.
 */
const matcherCache = new Map<string, MatchFunction<Record<string, string>>>();

/**
 * Returns a compiled match function for the given path pattern.
 * Uses a cache to avoid recompiling the same pattern multiple times.
 *
 * @param pattern - Express-style route pattern (e.g., "/users/:id/posts")
 * @returns A compiled match function from path-to-regexp
 */
function getOrCreateMatcher(
  pattern: string
): MatchFunction<Record<string, string>> {
  const cached = matcherCache.get(pattern);
  if (cached) return cached;

  const matcher = match<Record<string, string>>(pattern, {
    decode: decodeURIComponent,
  });
  matcherCache.set(pattern, matcher);
  return matcher;
}

// ─── Public API ──────────────────────────────────────────────────────────────

/**
 * Finds the first matching route for a given HTTP method and path.
 *
 * Routes are tested in priority order:
 * 1. Static routes (no parameters) are tested first
 * 2. Parameterized routes are tested in the order they appear
 *
 * This ensures that `/users/me` matches before `/users/:id` when both exist.
 *
 * @param routes - Array of route definitions from the database
 * @param method - The HTTP method of the incoming request (e.g., "GET")
 * @param path - The concrete request path (e.g., "/users/123/posts")
 * @returns The matched route and extracted params, or null if no match
 *
 * @example
 * ```ts
 * const routes = [
 *   { id: "1", method: "GET", path: "/users/:id" },
 *   { id: "2", method: "GET", path: "/users/me" },
 *   { id: "3", method: "POST", path: "/users" },
 * ];
 *
 * findMatchingRoute(routes, "GET", "/users/123");
 * // → { route: routes[0], params: { id: "123" } }
 *
 * findMatchingRoute(routes, "GET", "/users/me");
 * // → { route: routes[1], params: {} }
 * ```
 */
export function findMatchingRoute(
  routes: RouteDefinition[],
  method: string,
  path: string
): RouteMatchResult | null {
  // Filter routes by HTTP method first (case-insensitive)
  const methodRoutes = routes.filter(
    (r) => r.method.toUpperCase() === method.toUpperCase()
  );

  // Sort: static routes first, then parameterized routes
  const sortedRoutes = sortRoutesBySpecificity(methodRoutes);

  for (const route of sortedRoutes) {
    try {
      const matcher = getOrCreateMatcher(route.path);
      const result: MatchResult<Record<string, string>> | false = matcher(path);

      if (result) {
        return {
          route,
          params: { ...result.params },
        };
      }
    } catch (error) {
      // Skip routes with invalid path patterns rather than crashing
      console.warn(
        `[fack-api] Invalid route pattern "${route.path}":`,
        error
      );
    }
  }

  return null;
}

/**
 * Sorts routes by specificity to ensure correct matching priority.
 *
 * Specificity rules (highest to lowest):
 * 1. Static routes (no `:param` or `*` segments)
 * 2. Routes with fewer dynamic segments
 * 3. Routes with more total segments (longer paths)
 * 4. Original order as tiebreaker
 *
 * @param routes - Array of route definitions to sort
 * @returns A new array sorted by specificity (most specific first)
 */
function sortRoutesBySpecificity(
  routes: RouteDefinition[]
): RouteDefinition[] {
  return [...routes].sort((a, b) => {
    const aSegments = a.path.split("/").filter(Boolean);
    const bSegments = b.path.split("/").filter(Boolean);

    const aDynamic = aSegments.filter((s) => s.startsWith(":") || s === "*").length;
    const bDynamic = bSegments.filter((s) => s.startsWith(":") || s === "*").length;

    // Static routes first
    if (aDynamic === 0 && bDynamic > 0) return -1;
    if (bDynamic === 0 && aDynamic > 0) return 1;

    // Fewer dynamic segments = more specific
    if (aDynamic !== bDynamic) return aDynamic - bDynamic;

    // More total segments = more specific
    return bSegments.length - aSegments.length;
  });
}

/**
 * Clears the compiled matcher cache.
 * Useful when routes are modified and cached matchers may be stale.
 */
export function clearMatcherCache(): void {
  matcherCache.clear();
}
