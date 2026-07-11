"use server";

import { db } from "@/db";
import { canvasStates } from "@/db/schema";
import { eq } from "drizzle-orm";
import { generateId } from "@/lib/utils";
import {
  saveCanvasStateSchema,
  type SaveCanvasStateInput,
} from "@/lib/validators";

export async function getCanvasState(projectId: string): Promise<{
  id: string;
  projectId: string;
  nodes: string;
  edges: string;
  viewport: string;
} | undefined> {
  return db.query.canvasStates.findFirst({
    where: eq(canvasStates.projectId, projectId),
  });
}

export async function saveCanvasState(input: SaveCanvasStateInput): Promise<{
  id: string;
  projectId: string;
  nodes: string;
  edges: string;
  viewport: string;
}> {
  const parsed = saveCanvasStateSchema.parse(input);

  const existing = await db.query.canvasStates.findFirst({
    where: eq(canvasStates.projectId, parsed.projectId),
  });

  if (existing) {
    const [updated] = await db
      .update(canvasStates)
      .set({
        nodes: parsed.nodes,
        edges: parsed.edges,
        viewport: parsed.viewport,
      })
      .where(eq(canvasStates.projectId, parsed.projectId))
      .returning();
    return updated;
  }

  const [created] = await db
    .insert(canvasStates)
    .values({
      id: generateId(),
      projectId: parsed.projectId,
      nodes: parsed.nodes,
      edges: parsed.edges,
      viewport: parsed.viewport,
    })
    .returning();

  return created;
}
