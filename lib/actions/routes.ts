"use server";

import { db } from "@/db";
import { routes, endpoints, type Route, type Endpoint } from "@/db/schema";
import { eq, inArray } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { generateId } from "@/lib/utils";
import { clearCache } from "@/lib/cache";
import {
  createRouteSchema,
  updateRouteSchema,
  type CreateRouteInput,
  type UpdateRouteInput,
} from "@/lib/validators";
import { LoggerRegistry } from "@/lib/logger-registry";

const routesTrace = LoggerRegistry.getTrace("db-routes");

/**
 * Retrieves all routes belonging to a specific endpoint group.
 */
export async function getRoutes(endpointId: string): Promise<Route[]> {
  routesTrace.traceCall("getRoutes", endpointId);
  try {
    const list = await db.query.routes.findMany({
      where: eq(routes.endpointId, endpointId),
      orderBy: (routes, { asc }) => [asc(routes.path)],
    });
    routesTrace.traceSuccess("getRoutes", `${list.length} routes`);
    return list;
  } catch (error) {
    routesTrace.traceError("getRoutes", error);
    throw error;
  }
}

/**
 * Retrieves a single route by its unique ID.
 */
export async function getRouteById(id: string): Promise<Route | undefined> {
  routesTrace.traceCall("getRouteById", id);
  try {
    const res = await db.query.routes.findFirst({
      where: eq(routes.id, id),
    });
    routesTrace.traceSuccess(
      "getRouteById",
      res ? `${res.method} ${res.path}` : "undefined",
    );
    return res;
  } catch (error) {
    routesTrace.traceError("getRouteById", error);
    throw error;
  }
}

/**
 * Retrieves all routes scoped to a specific project, preventing multi-tenant data leaks.
 */
export async function getRoutesByProjectId(
  projectId: string,
): Promise<(Route & { endpoint: Endpoint })[]> {
  routesTrace.traceCall("getRoutesByProjectId", projectId);
  try {
    const projectEndpoints = await db.query.endpoints.findMany({
      where: eq(endpoints.projectId, projectId),
      columns: { id: true },
    });

    if (projectEndpoints.length === 0) {
      routesTrace.traceSuccess(
        "getRoutesByProjectId",
        "0 routes (no endpoints)",
      );
      return [];
    }

    const endpointIds = projectEndpoints.map((ep) => ep.id);
    const list = await db.query.routes.findMany({
      where: inArray(routes.endpointId, endpointIds),
      with: {
        endpoint: true,
      },
      orderBy: (routes, { asc }) => [asc(routes.path)],
    });

    routesTrace.traceSuccess("getRoutesByProjectId", `${list.length} routes`);
    return list as (Route & { endpoint: Endpoint })[];
  } catch (error) {
    routesTrace.traceError("getRoutesByProjectId", error);
    throw error;
  }
}

/**
 * Creates a new route under a designated endpoint.
 */
export async function createRoute(input: CreateRouteInput): Promise<Route> {
  routesTrace.traceCall(
    "createRoute",
    input.endpointId,
    input.method,
    input.path,
  );
  try {
    const parsed = createRouteSchema.parse(input);
    const id = generateId();

    const [route] = await db
      .insert(routes)
      .values({
        id,
        endpointId: parsed.endpointId,
        method: parsed.method,
        path: parsed.path,
        statusCode: parsed.statusCode,
        responseSchema: parsed.responseSchema || "{}",
      })
      .returning();

    clearCache();
    revalidatePath("/");
    routesTrace.traceSuccess("createRoute", `${route.method} ${route.path}`);
    return route;
  } catch (error) {
    routesTrace.traceError("createRoute", error);
    throw error;
  }
}

/**
 * Updates route configuration properties.
 */
export async function updateRoute(input: UpdateRouteInput): Promise<Route> {
  routesTrace.traceCall("updateRoute", input.id, input.method, input.path);
  try {
    const parsed = updateRouteSchema.parse(input);
    const { id, ...updates } = parsed;

    const [route] = await db
      .update(routes)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(routes.id, id))
      .returning();

    clearCache();
    revalidatePath("/");
    routesTrace.traceSuccess("updateRoute", `${route.method} ${route.path}`);
    return route;
  } catch (error) {
    routesTrace.traceError("updateRoute", error);
    throw error;
  }
}

/**
 * Deletes a route by its ID.
 */
export async function deleteRoute(id: string): Promise<void> {
  routesTrace.traceCall("deleteRoute", id);
  try {
    await db.delete(routes).where(eq(routes.id, id));
    clearCache();
    revalidatePath("/");
    routesTrace.traceSuccess("deleteRoute", "void");
  } catch (error) {
    routesTrace.traceError("deleteRoute", error);
    throw error;
  }
}
