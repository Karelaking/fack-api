"use server";

import { db } from "@/db";
import { endpoints } from "@/db/schema";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { generateId } from "@/lib/utils";
import { clearCache } from "@/lib/cache";
import {
  createEndpointSchema,
  updateEndpointSchema,
  type CreateEndpointInput,
  type UpdateEndpointInput,
} from "@/lib/validators";
import { LoggerRegistry } from "@/lib/logger-registry";

const endpointsTrace = LoggerRegistry.getTrace("db-endpoints");

export async function getEndpoints(projectId: string) {
  endpointsTrace.traceCall("getEndpoints", projectId);
  try {
    const list = await db.query.endpoints.findMany({
      where: eq(endpoints.projectId, projectId),
      with: {
        routes: true,
      },
      orderBy: (endpoints, { asc }) => [asc(endpoints.name)],
    });
    endpointsTrace.traceSuccess("getEndpoints", `${list.length} endpoints`);
    return list;
  } catch (error) {
    endpointsTrace.traceError("getEndpoints", error);
    throw error;
  }
}

export async function getEndpointById(id: string): Promise<
  | {
      id: string;
      name: string;
      description: string | null;
      createdAt: Date;
      updatedAt: Date;
      projectId: string;
      basePath: string;
      routes: {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        endpointId: string;
        method: "GET" | "POST" | "PUT" | "DELETE" | "PATCH";
        path: string;
        statusCode: number;
        responseSchema: string | null;
        latencyMin: number | null;
        latencyMax: number | null;
        errorRate: number | null;
        customHeaders: string | null;
        isEnabled: boolean;
      }[];
    }
  | undefined
> {
  endpointsTrace.traceCall("getEndpointById", id);
  try {
    const res = await db.query.endpoints.findFirst({
      where: eq(endpoints.id, id),
      with: {
        routes: true,
      },
    });
    endpointsTrace.traceSuccess(
      "getEndpointById",
      res ? res.name : "undefined",
    );
    return res;
  } catch (error) {
    endpointsTrace.traceError("getEndpointById", error);
    throw error;
  }
}

export async function createEndpoint(
  input: CreateEndpointInput,
): Promise<typeof endpoints.$inferSelect> {
  endpointsTrace.traceCall("createEndpoint", input.projectId, input.name);
  try {
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

    clearCache();
    revalidatePath("/");
    endpointsTrace.traceSuccess("createEndpoint", endpoint.name);
    return endpoint;
  } catch (error) {
    endpointsTrace.traceError("createEndpoint", error);
    throw error;
  }
}

export async function updateEndpoint(
  input: UpdateEndpointInput,
): Promise<typeof endpoints.$inferSelect> {
  endpointsTrace.traceCall("updateEndpoint", input.id, input.name);
  try {
    const parsed = updateEndpointSchema.parse(input);
    const { id, ...updates } = parsed;

    const [endpoint] = await db
      .update(endpoints)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(endpoints.id, id))
      .returning();

    clearCache();
    revalidatePath("/");
    endpointsTrace.traceSuccess("updateEndpoint", endpoint.name);
    return endpoint;
  } catch (error) {
    endpointsTrace.traceError("updateEndpoint", error);
    throw error;
  }
}

export async function deleteEndpoint(id: string): Promise<void> {
  endpointsTrace.traceCall("deleteEndpoint", id);
  try {
    await db.delete(endpoints).where(eq(endpoints.id, id));
    clearCache();
    revalidatePath("/");
    endpointsTrace.traceSuccess("deleteEndpoint", "void");
  } catch (error) {
    endpointsTrace.traceError("deleteEndpoint", error);
    throw error;
  }
}
