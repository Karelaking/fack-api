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
import { LoggerRegistry } from "@/lib/logger-registry";

const routesTrace = LoggerRegistry.getTrace("db-routes");

export async function getRoutes(endpointId: string) {
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

export async function getRouteById(id: string) {
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

export async function getRoutesByProjectId(_projectId: string) {
  routesTrace.traceCall("getRoutesByProjectId", _projectId);
  try {
    const list = await db.query.routes.findMany({
      with: {
        endpoint: true,
      },
    });
    routesTrace.traceSuccess("getRoutesByProjectId", `${list.length} routes`);
    return list;
  } catch (error) {
    routesTrace.traceError("getRoutesByProjectId", error);
    throw error;
  }
}

export async function createRoute(input: CreateRouteInput) {
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

export async function updateRoute(input: UpdateRouteInput) {
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

export async function deleteRoute(id: string) {
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
