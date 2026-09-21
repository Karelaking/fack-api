/**
 * Fack AI API Architect — Apply Route Handler
 *
 * POST /api/ai/apply
 *
 * Executes user-approved API changes inside an atomic database transaction
 * with full rollback on failure, synchronizing the visual canvas layout.
 */

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { clearCache } from "@/lib/cache";
import {
  getEndpointsByProjectId,
  createEndpointRecord,
} from "@/lib/services/endpoint.service";
import {
  createRouteRecord,
  updateRouteRecord,
  deleteRouteRecord,
} from "@/lib/services/route.service";
import {
  computeCanvasLayout,
  persistCanvasState,
} from "@/lib/services/canvas.service";
import type { ApplyApiRequest, ApplyApiResponse } from "@/lib/types/ai.type";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest): Promise<Response> {
  try {
    const body = (await request.json()) as ApplyApiRequest;
    const { projectId, changes } = body;

    if (!projectId) {
      return NextResponse.json(
        { success: false, error: "projectId is required" },
        { status: 400 },
      );
    }

    if (!changes || !Array.isArray(changes) || changes.length === 0) {
      return NextResponse.json(
        { success: false, error: "No changes provided to apply" },
        { status: 400 },
      );
    }

    let createdEndpointsCount = 0;
    let createdRoutesCount = 0;
    let updatedRoutesCount = 0;
    let deletedRoutesCount = 0;

    // Execute all mutations atomically inside a single transaction
    await db.transaction(async (tx) => {
      // Pre-fetch current endpoints in project
      const existingEndpoints = await getEndpointsByProjectId(projectId, tx);
      const endpointNameToIdMap = new Map<string, string>();
      for (const ep of existingEndpoints) {
        endpointNameToIdMap.set(ep.name.trim().toLowerCase(), ep.id);
      }

      // 1. Process CREATE_ENDPOINT changes first
      for (const change of changes) {
        if (change.type === "CREATE_ENDPOINT") {
          const normalizedName = change.endpoint.name.trim().toLowerCase();
          if (!endpointNameToIdMap.has(normalizedName)) {
            const newEndpoint = await createEndpointRecord(
              {
                projectId,
                name: change.endpoint.name.trim(),
                description: change.endpoint.description ?? "",
                basePath: change.endpoint.basePath,
              },
              tx,
            );
            endpointNameToIdMap.set(normalizedName, newEndpoint.id);
            createdEndpointsCount++;
          }
        }
      }

      // 2. Process route operations (CREATE, UPDATE, DELETE)
      for (const change of changes) {
        if (change.type === "CREATE_ROUTE") {
          let targetEndpointId = change.endpointId;
          if (!targetEndpointId && change.endpointName) {
            targetEndpointId = endpointNameToIdMap.get(
              change.endpointName.trim().toLowerCase(),
            );
          }

          if (!targetEndpointId) {
            // Fallback: create the endpoint on the fly if not already present
            const newEp = await createEndpointRecord(
              {
                projectId,
                name: change.endpointName,
                basePath: `/${change.endpointName.toLowerCase()}`,
              },
              tx,
            );
            targetEndpointId = newEp.id;
            endpointNameToIdMap.set(
              change.endpointName.trim().toLowerCase(),
              newEp.id,
            );
            createdEndpointsCount++;
          }

          const routePath =
            change.route.path && change.route.path.trim()
              ? change.route.path.trim().startsWith("/")
                ? change.route.path.trim()
                : `/${change.route.path.trim()}`
              : "/";

          await createRouteRecord(
            {
              endpointId: targetEndpointId,
              method: change.route.method,
              path: routePath,
              statusCode: change.route.statusCode,
              responseSchema: change.route.responseSchema,
              latencyMin: change.route.latencyMin,
              latencyMax: change.route.latencyMax,
              errorRate: change.route.errorRate,
              customHeaders: change.route.customHeaders,
            },
            tx,
          );
          createdRoutesCount++;
        } else if (change.type === "UPDATE_ROUTE") {
          const routePath =
            change.changes.path !== undefined
              ? change.changes.path && change.changes.path.trim()
                ? change.changes.path.trim().startsWith("/")
                  ? change.changes.path.trim()
                  : `/${change.changes.path.trim()}`
                : "/"
              : undefined;

          await updateRouteRecord(
            {
              id: change.routeId,
              method: change.changes.method,
              path: routePath,
              statusCode: change.changes.statusCode,
              responseSchema: change.changes.responseSchema,
              latencyMin: change.changes.latencyMin,
              latencyMax: change.changes.latencyMax,
              errorRate: change.changes.errorRate,
              customHeaders: change.changes.customHeaders,
            },
            tx,
          );
          updatedRoutesCount++;
        } else if (change.type === "DELETE_ROUTE") {
          await deleteRouteRecord(change.routeId, tx);
          deletedRoutesCount++;
        }
      }

      // 3. Reconcile and calculate new Canvas positions
      const refreshedEndpoints = await getEndpointsByProjectId(projectId, tx);
      const canvasLayout = computeCanvasLayout(refreshedEndpoints);
      await persistCanvasState(projectId, canvasLayout, tx);
    });

    // Clear server-side caches
    clearCache();

    const response: ApplyApiResponse = {
      success: true,
      created: {
        endpoints: createdEndpointsCount,
        routes: createdRoutesCount,
      },
      updated: updatedRoutesCount,
      deleted: deletedRoutesCount,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error(
      "[Fack AI] Failed to apply API changes, rolling back transaction:",
      error,
    );
    const message =
      error instanceof Error ? error.message : "Failed to apply API changes";
    return NextResponse.json(
      {
        success: false,
        error: message,
      },
      { status: 500 },
    );
  }
}
