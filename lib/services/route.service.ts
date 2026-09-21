/**
 * Fack AI API Architect — Route Domain Service
 *
 * Encapsulates route persistence and transactional mutations, guaranteeing
 * validation and isolation from direct SQL.
 */

import { db } from "@/db";
import { routes, endpoints, type Route, type Endpoint } from "@/db/schema";
import { eq, inArray } from "drizzle-orm";
import { generateId } from "@/lib/utils";
import { clearCache } from "@/lib/cache";
import {
  createRouteSchema,
  updateRouteSchema,
  type CreateRouteInput,
  type UpdateRouteInput,
} from "@/lib/validators";
import type { DatabaseExecutor } from "./endpoint.service";

export type RouteWithEndpoint = Route & {
  endpoint: Endpoint;
};

/**
 * Retrieves all routes scoped to a specific project.
 */
export async function getRoutesByProjectId(
  projectId: string,
  executor: DatabaseExecutor = db,
): Promise<RouteWithEndpoint[]> {
  const projectEndpoints = await executor.query.endpoints.findMany({
    where: eq(endpoints.projectId, projectId),
    columns: { id: true },
  });

  if (projectEndpoints.length === 0) {
    return [];
  }

  const endpointIds = projectEndpoints.map((ep) => ep.id);
  const list = await executor.query.routes.findMany({
    where: inArray(routes.endpointId, endpointIds),
    with: {
      endpoint: true,
    },
    orderBy: (routesTable, { asc }) => [asc(routesTable.path)],
  });

  return list as RouteWithEndpoint[];
}

/**
 * Retrieves a single route by its ID.
 */
export async function findRouteById(
  id: string,
  executor: DatabaseExecutor = db,
): Promise<Route | undefined> {
  const route = await executor.query.routes.findFirst({
    where: eq(routes.id, id),
  });

  return route;
}

/**
 * Creates a new route record inside an optional transaction.
 */
export async function createRouteRecord(
  input: CreateRouteInput & {
    latencyMin?: number;
    latencyMax?: number;
    errorRate?: number;
    customHeaders?: string;
  },
  executor: DatabaseExecutor = db,
): Promise<Route> {
  const rawPath = input.path && input.path.trim() ? input.path.trim() : "/";
  const cleanPath = rawPath.startsWith("/") ? rawPath : `/${rawPath}`;

  const parsed = createRouteSchema.parse({
    endpointId: input.endpointId,
    method: input.method,
    path: cleanPath,
    statusCode: input.statusCode,
    responseSchema: input.responseSchema,
  });

  const id = generateId();

  const [created] = await executor
    .insert(routes)
    .values({
      id,
      endpointId: parsed.endpointId,
      method: parsed.method,
      path: parsed.path,
      statusCode: parsed.statusCode,
      responseSchema: parsed.responseSchema || "{}",
      latencyMin: input.latencyMin ?? 0,
      latencyMax: input.latencyMax ?? 0,
      errorRate: input.errorRate ?? 0,
      customHeaders: input.customHeaders ?? "{}",
    })
    .returning();

  clearCache();
  return created;
}

/**
 * Updates a route record.
 */
export async function updateRouteRecord(
  input: UpdateRouteInput,
  executor: DatabaseExecutor = db,
): Promise<Route> {
  const parsed = updateRouteSchema.parse(input);
  const { id, ...updates } = parsed;

  const [updated] = await executor
    .update(routes)
    .set({
      ...updates,
      updatedAt: new Date(),
    })
    .where(eq(routes.id, id))
    .returning();

  clearCache();
  return updated;
}

/**
 * Deletes a route record.
 */
export async function deleteRouteRecord(
  id: string,
  executor: DatabaseExecutor = db,
): Promise<void> {
  await executor.delete(routes).where(eq(routes.id, id));
  clearCache();
}
