/**
 * Fack AI API Architect — Endpoint Domain Service
 *
 * Provides database operations for endpoints with optional transaction support,
 * ensuring atomic multi-step mutations without direct SQL execution.
 */

import { db } from "@/db";
import { endpoints, type Endpoint, type Route } from "@/db/schema";
import { eq } from "drizzle-orm";
import { generateId } from "@/lib/utils";
import { clearCache } from "@/lib/cache";
import {
  createEndpointSchema,
  updateEndpointSchema,
  type CreateEndpointInput,
  type UpdateEndpointInput,
} from "@/lib/validators";

export type DatabaseExecutor =
  | typeof db
  | Parameters<Parameters<typeof db.transaction>[0]>[0];

export type EndpointWithRoutes = Endpoint & {
  routes: Route[];
};

/**
 * Retrieves all endpoints belonging to a project with nested routes.
 */
export async function getEndpointsByProjectId(
  projectId: string,
  executor: DatabaseExecutor = db,
): Promise<EndpointWithRoutes[]> {
  const list = await executor.query.endpoints.findMany({
    where: eq(endpoints.projectId, projectId),
    with: {
      routes: true,
    },
    orderBy: (endpointsTable, { asc }) => [asc(endpointsTable.name)],
  });

  return list as EndpointWithRoutes[];
}

/**
 * Finds an endpoint in a project by name (case-insensitive comparison).
 */
export async function findEndpointByName(
  projectId: string,
  name: string,
  executor: DatabaseExecutor = db,
): Promise<Endpoint | undefined> {
  const list = await executor.query.endpoints.findMany({
    where: eq(endpoints.projectId, projectId),
  });

  const target = name.trim().toLowerCase();
  const found = list.find((ep) => ep.name.trim().toLowerCase() === target);
  return found;
}

/**
 * Creates a new endpoint record inside an optional transaction.
 */
export async function createEndpointRecord(
  input: CreateEndpointInput,
  executor: DatabaseExecutor = db,
): Promise<Endpoint> {
  const parsed = createEndpointSchema.parse(input);
  const id = generateId();

  const [created] = await executor
    .insert(endpoints)
    .values({
      id,
      projectId: parsed.projectId,
      name: parsed.name,
      description: parsed.description ?? "",
      basePath: parsed.basePath ?? "",
    })
    .returning();

  clearCache();
  return created;
}

/**
 * Updates an endpoint record.
 */
export async function updateEndpointRecord(
  input: UpdateEndpointInput,
  executor: DatabaseExecutor = db,
): Promise<Endpoint> {
  const parsed = updateEndpointSchema.parse(input);
  const { id, ...updates } = parsed;

  const [updated] = await executor
    .update(endpoints)
    .set({
      ...updates,
      updatedAt: new Date(),
    })
    .where(eq(endpoints.id, id))
    .returning();

  clearCache();
  return updated;
}

/**
 * Deletes an endpoint record.
 */
export async function deleteEndpointRecord(
  id: string,
  executor: DatabaseExecutor = db,
): Promise<void> {
  await executor.delete(endpoints).where(eq(endpoints.id, id));
  clearCache();
}
