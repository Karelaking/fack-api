import { eq } from "drizzle-orm";
import { db } from "@/db";
import { endpoints } from "@/db/schema";
import {
  getCachedRoutes,
  setCachedRoutes,
  type CachedRoute,
} from "@/lib/cache";
import { findMatchingRoute, type RouteMatchResult } from "@/lib/route-matcher";
import { LoggerRegistry } from "@/lib/logger-registry";

const routeServiceTrace = LoggerRegistry.getTrace("mock-route");

function normalizePath(path: string): string {
  const normalized = ("/" + path).replace(/\/+/g, "/").replace(/\/$/, "");
  return normalized || "/";
}

export async function getProjectMockRoutes(
  projectId: string,
): Promise<CachedRoute[]> {
  const cachedRoutes = getCachedRoutes(projectId);
  if (cachedRoutes) {
    return cachedRoutes;
  }

  const projectEndpoints = await db.query.endpoints.findMany({
    where: eq(endpoints.projectId, projectId),
    with: {
      routes: {
        with: { webhooks: true },
      },
    },
  });

  const routes = projectEndpoints.flatMap((endpoint) =>
    endpoint.routes.map((route) => ({
      ...route,
      endpoint: {
        id: endpoint.id,
        basePath: endpoint.basePath,
        name: endpoint.name,
      },
      path: normalizePath(endpoint.basePath + route.path),
    })),
  );

  setCachedRoutes(projectId, routes);
  return routes;
}

export async function matchProjectMockRoute(
  projectId: string,
  method: string,
  requestPath: string,
): Promise<RouteMatchResult | null> {
  const routes = await getProjectMockRoutes(projectId);
  const enabledRoutes = routes.filter((route) => route.isEnabled);
  const match = findMatchingRoute(enabledRoutes, method, requestPath);
  routeServiceTrace.traceSuccess(
    "matchProjectMockRoute",
    match ? `${method} ${requestPath}` : "no match",
  );
  return match;
}
