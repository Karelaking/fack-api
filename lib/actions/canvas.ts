"use server";

import { db } from "@/db";
import { canvasStates } from "@/db/schema";
import { eq } from "drizzle-orm";
import { generateId } from "@/lib/utils";
import {
  saveCanvasStateSchema,
  type SaveCanvasStateInput,
} from "@/lib/validators";
import { LoggerRegistry } from "@/lib/logger-registry";

const canvasTrace = LoggerRegistry.getTrace("db-canvas");

export async function getCanvasState(projectId: string): Promise<
  | {
      id: string;
      projectId: string;
      nodes: string;
      edges: string;
      viewport: string;
    }
  | undefined
> {
  canvasTrace.traceCall("getCanvasState", projectId);
  try {
    const res = await db.query.canvasStates.findFirst({
      where: eq(canvasStates.projectId, projectId),
    });
    canvasTrace.traceSuccess(
      "getCanvasState",
      res ? `State ID: ${res.id}` : "undefined",
    );
    return res;
  } catch (error) {
    canvasTrace.traceError("getCanvasState", error);
    throw error;
  }
}

export async function saveCanvasState(input: SaveCanvasStateInput): Promise<{
  id: string;
  projectId: string;
  nodes: string;
  edges: string;
  viewport: string;
}> {
  canvasTrace.traceCall("saveCanvasState", input.projectId);
  try {
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
      canvasTrace.traceSuccess("saveCanvasState (updated)", updated.id);
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

    canvasTrace.traceSuccess("saveCanvasState (created)", created.id);
    return created;
  } catch (error) {
    canvasTrace.traceError("saveCanvasState", error);
    throw error;
  }
}
