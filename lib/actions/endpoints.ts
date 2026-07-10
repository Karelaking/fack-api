"use server";

import { db } from "@/db";
import { endpoints } from "@/db/schema";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { generateId } from "@/lib/utils";
import {
  createEndpointSchema,
  updateEndpointSchema,
  type CreateEndpointInput,
  type UpdateEndpointInput,
} from "@/lib/validators";

export async function getEndpoints(projectId: string) {
  return db.query.endpoints.findMany({
    where: eq(endpoints.projectId, projectId),
    with: {
      routes: true,
    },
    orderBy: (endpoints, { asc }) => [asc(endpoints.name)],
  });
}

export async function getEndpointById(id: string) {
  return db.query.endpoints.findFirst({
    where: eq(endpoints.id, id),
    with: {
      routes: true,
    },
  });
}

export async function createEndpoint(input: CreateEndpointInput) {
  const parsed = createEndpointSchema.parse(input);
  const id = generateId();

  const [endpoint] = await db
    .insert(endpoints)
    .values({
      id,
      projectId: parsed.projectId,
      name: parsed.name,
      description: parsed.description ?? "",
      basePath: parsed.basePath ?? "",
    })
    .returning();

  revalidatePath("/");
  return endpoint;
}

export async function updateEndpoint(input: UpdateEndpointInput) {
  const parsed = updateEndpointSchema.parse(input);
  const { id, ...updates } = parsed;

  const [endpoint] = await db
    .update(endpoints)
    .set({ ...updates, updatedAt: new Date() })
    .where(eq(endpoints.id, id))
    .returning();

  revalidatePath("/");
  return endpoint;
}

export async function deleteEndpoint(id: string) {
  await db.delete(endpoints).where(eq(endpoints.id, id));
  revalidatePath("/");
}
