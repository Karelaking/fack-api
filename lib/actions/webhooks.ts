"use server";

import { db } from "@/db";
import { webhooks, type Webhook } from "@/db/schema";
import { eq } from "drizzle-orm";
import { nanoid } from "nanoid";
import { revalidatePath } from "next/cache";
import {
  requireProjectAccess,
  requireRouteAccess,
  requireWebhookAccess,
} from "@/lib/auth";

export async function getWebhooksForRoute(routeId: string): Promise<Webhook[]> {
  return db.query.webhooks.findMany({
    where: eq(webhooks.routeId, routeId),
    orderBy: (w, { desc }) => [desc(w.createdAt)],
  });
}

export async function createWebhook(
  projectId: string,
  routeId: string,
  url: string,
  method: "GET" | "POST" | "PUT" | "DELETE" | "PATCH",
  payloadTemplate: string,
  delayMs: number,
) {
  await requireProjectAccess(projectId);
  await requireRouteAccess(routeId);
  const [newWebhook] = await db
    .insert(webhooks)
    .values({
      id: nanoid(),
      routeId,
      url,
      method,
      payloadTemplate,
      delayMs,
    })
    .returning();

  // clear cache for this project since we updated route relations
  const { clearProjectCache } = await import("@/lib/cache");
  // Need to get project slug? Not easily available here without query.
  // Actually, wait, revalidatePath might be enough for frontend, but backend cache needs clearing.
  const { projects } = await import("@/db/schema");
  const project = await db.query.projects.findFirst({
    where: eq(projects.id, projectId),
  });
  if (project) clearProjectCache(project.id, project.slug);

  revalidatePath(`/projects/${projectId}`);
  return newWebhook;
}

export async function deleteWebhook(webhookId: string, projectId: string) {
  await requireWebhookAccess(webhookId);
  await requireProjectAccess(projectId);
  await db.delete(webhooks).where(eq(webhooks.id, webhookId));

  const { clearProjectCache } = await import("@/lib/cache");
  const { projects } = await import("@/db/schema");
  const project = await db.query.projects.findFirst({
    where: eq(projects.id, projectId),
  });
  if (project) clearProjectCache(project.id, project.slug);

  revalidatePath(`/projects/${projectId}`);
}
