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
  getRoutesByProjectId,
} from "@/lib/services/route.service";
import {
  computeCanvasLayout,
  persistCanvasState,
} from "@/lib/services/canvas.service";
import type {
  ApplyApiRequest,
  ApplyApiResponse,
  ApiChangeSet,
  GeneratedApi,
  ApiChange,
} from "@/lib/ai/types";
import { buildApiChangeSet } from "@/lib/ai/validator.service";
import {
  projects,
  generationProposals,
  generationTasks,
  projectRevisions,
} from "@/db/schema";
import { eq } from "drizzle-orm";
import { nanoid } from "nanoid";
import { generateOpenApi } from "@/lib/services/openapi.service";
import { authErrorResponse, requireProjectAccess } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest): Promise<Response> {
  try {
    const body = (await request.json()) as ApplyApiRequest;
    const { projectId, proposalId, expectedVersion, resolutions } = body;

    if (!projectId || !proposalId || expectedVersion === undefined) {
      return NextResponse.json(
        {
          success: false,
          error: "projectId, proposalId, and expectedVersion are required",
        },
        { status: 400 },
      );
    }

    await requireProjectAccess(projectId);

    let createdEndpointsCount = 0;
    let createdRoutesCount = 0;
    let updatedRoutesCount = 0;
    let deletedRoutesCount = 0;

    // Execute all mutations atomically inside a single transaction
    await db.transaction(async (tx) => {
      // 1. Verify Project Version (Optimistic Concurrency)
      const project = await tx.query.projects.findFirst({
        where: eq(projects.id, projectId),
      });

      if (!project) {
        throw new Error("Project not found");
      }

      if (project.version !== expectedVersion) {
        throw new Error(
          `Project state has changed (version mismatch). Please re-generate the proposal.`,
        );
      }

      // 2. Fetch Generation Proposal
      const proposal = await tx.query.generationProposals.findFirst({
        where: eq(generationProposals.id, proposalId),
      });

      if (!proposal) {
        throw new Error("Proposal not found");
      }

      if (proposal.projectId !== projectId) {
        throw new Error("Proposal does not belong to this project");
      }

      const payload = JSON.parse(proposal.payload) as {
        generatedApi: GeneratedApi;
        changeSet: ApiChangeSet;
      };

      // 3. Re-calculate change set with user resolutions
      const existingEndpoints = await getEndpointsByProjectId(projectId, tx);
      const existingRoutes = await getRoutesByProjectId(projectId, tx);

      const changeSet = buildApiChangeSet(
        payload.generatedApi,
        existingEndpoints,
        existingRoutes,
        resolutions,
      );

      // We map changeSet to standard format expected below
      const changes: ApiChange[] = [
        ...changeSet.endpointsToCreate.map((ep) => ({
          type: "CREATE_ENDPOINT" as const,
          endpoint: {
            name: ep.name,
            description: ep.description,
            basePath: ep.basePath,
          },
        })),
        ...changeSet.routesToCreate.map((r) => {
          const cleanPath =
            r.route.path && r.route.path.trim()
              ? r.route.path.trim().startsWith("/")
                ? r.route.path.trim()
                : `/${r.route.path.trim()}`
              : "/";

          return {
            type: "CREATE_ROUTE" as const,
            endpointName: r.endpointName,
            endpointId: r.endpointId,
            route: {
              method: r.route.method,
              path: cleanPath,
              statusCode: r.route.statusCode,
              responseSchema: JSON.stringify(
                {
                  type: "object",
                  properties: Object.fromEntries(
                    r.route.properties.map((p) => [
                      p.name,
                      {
                        type: p.type,
                        ...(p.fakerProvider
                          ? {
                              "x-faker": p.fakerProvider,
                              faker: p.fakerProvider,
                            }
                          : {}),
                      },
                    ]),
                  ),
                  required: r.route.properties
                    .filter((p) => !p.nullable)
                    .map((p) => p.name),
                },
                undefined,
                2,
              ),
              latencyMin: r.route.latency.min,
              latencyMax: r.route.latency.max,
              errorRate: r.route.errorRate,
            },
          };
        }),
        ...changeSet.routesToUpdate.map((r) => {
          const cleanPath =
            r.proposedRoute.path && r.proposedRoute.path.trim()
              ? r.proposedRoute.path.trim().startsWith("/")
                ? r.proposedRoute.path.trim()
                : `/${r.proposedRoute.path.trim()}`
              : "/";

          return {
            type: "UPDATE_ROUTE" as const,
            routeId: r.routeId,
            changes: {
              method: r.proposedRoute.method,
              path: cleanPath,
              statusCode: r.proposedRoute.statusCode,
              latencyMin: r.proposedRoute.latency.min,
              latencyMax: r.proposedRoute.latency.max,
              errorRate: r.proposedRoute.errorRate,
            },
          };
        }),
      ];

      const endpointNameToIdMap = new Map<string, string>();
      for (const ep of existingEndpoints) {
        endpointNameToIdMap.set(ep.name.trim().toLowerCase(), ep.id);
      }

      // 4. Process CREATE_ENDPOINT changes first
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

      // 5. Process route operations (CREATE, UPDATE, DELETE)
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

      // 6. Update Project version and Task Status
      const nextVersion = project.version + 1;
      await tx
        .update(projects)
        .set({ version: nextVersion })
        .where(eq(projects.id, projectId));

      await tx
        .update(generationTasks)
        .set({ status: "completed" })
        .where(eq(generationTasks.id, proposal.taskId));

      // 7. Reconcile and calculate new Canvas positions
      const refreshedEndpoints = await getEndpointsByProjectId(projectId, tx);
      const canvasLayout = computeCanvasLayout(refreshedEndpoints);
      await persistCanvasState(projectId, canvasLayout, tx);

      // 8. Snapshot Version History
      const projectForOpenApi = {
        ...project,
        endpoints: refreshedEndpoints,
      };
      const openApiSnapshot = JSON.stringify(
        generateOpenApi(projectForOpenApi),
      );

      await tx.insert(projectRevisions).values({
        id: nanoid(),
        projectId,
        version: nextVersion,
        description: `Applied AI API Specification (Proposal ${proposalId})`,
        snapshot: openApiSnapshot,
      });
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
    const authResponse = authErrorResponse(error);
    if (authResponse) return authResponse;

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
