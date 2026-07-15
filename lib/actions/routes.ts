"use server";

import { db } from "@/db";
import { routes } from "@/db/schema";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { generateId } from "@/lib/utils";
import { clearCache } from "@/lib/cache";
import {
  createRouteSchema,
  updateRouteSchema,
  type CreateRouteInput,
  type UpdateRouteInput,
} from "@/lib/validators";

export async function getRoutes(endpointId: string) {
  return db.query.routes.findMany({
    where: eq(routes.endpointId, endpointId),
    orderBy: (routes, { asc }) => [asc(routes.path)],
  });
}

export async function getRouteById(id: string) {
  return db.query.routes.findFirst({
    where: eq(routes.id, id),
  });
}

export async function getRoutesByProjectId(
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _projectId: string
) {
  return db.query.routes.findMany({
    with: {
      endpoint: true,
    },
  });
}

export async function createRoute(input: CreateRouteInput) {
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
  return route;
}

export async function updateRoute(input: UpdateRouteInput) {
  const parsed = updateRouteSchema.parse(input);
  const { id, ...updates } = parsed;

  const [route] = await db
    .update(routes)
    .set({ ...updates, updatedAt: new Date() })
    .where(eq(routes.id, id))
    .returning();

  clearCache();
  revalidatePath("/");
  return route;
}

export async function deleteRoute(id: string) {
  await db.delete(routes).where(eq(routes.id, id));
  clearCache();
  revalidatePath("/");
}
