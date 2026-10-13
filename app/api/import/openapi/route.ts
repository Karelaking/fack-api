import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { projects, generationProposals, generationTasks } from "@/db/schema";
import { eq } from "drizzle-orm";
import { nanoid } from "nanoid";
import { parseOpenApiDocument } from "@/lib/services/import.service";
import {
  validateAndNormalizeApi,
  buildApiChangeSet,
} from "@/lib/ai/ai-validator.service";
import { getEndpointsByProjectId } from "@/lib/services/endpoint.service";
import { getRoutesByProjectId } from "@/lib/services/route.service";
import type { GenerateApiResponse } from "@/lib/types/ai.type";
import {
  assertProjectOwnedBy,
  authErrorResponse,
  requireUserId,
} from "@/lib/auth";

export async function POST(req: NextRequest) {
  try {
    const { projectId, openApiString } = await req.json();

    if (!projectId || !openApiString) {
      return NextResponse.json(
        { success: false, error: "projectId and openApiString are required" },
        { status: 400 },
      );
    }

    const userId = await requireUserId();

    const projectRow = await db.query.projects.findFirst({
      where: eq(projects.id, projectId),
    });

    if (!projectRow) {
      return NextResponse.json(
        { success: false, error: "Project not found" },
        { status: 404 },
      );
    }

    assertProjectOwnedBy(projectRow, userId);

    let parsedDoc;
    try {
      parsedDoc = JSON.parse(openApiString);
    } catch {
      // Basic fallback to YAML could go here if we add a yaml parser
      return NextResponse.json(
        { success: false, error: "Invalid JSON format for OpenAPI document" },
        { status: 400 },
      );
    }

    const rawGeneratedApi = parseOpenApiDocument(parsedDoc);
    const validation = validateAndNormalizeApi(rawGeneratedApi);
    const validatedApi = validation.normalizedApi ?? rawGeneratedApi;

    const existingEndpoints = await getEndpointsByProjectId(projectId);
    const existingRoutes = await getRoutesByProjectId(projectId);

    const changeSet = buildApiChangeSet(
      validatedApi,
      existingEndpoints,
      existingRoutes,
    );

    // Create a dummy generation task for the audit trail
    const taskId = nanoid();
    await db.insert(generationTasks).values({
      id: taskId,
      projectId,
      prompt: "Imported from OpenAPI",
      status: "completed",
      providerMetadata: "openapi-import",
    });

    const proposalId = nanoid();
    const expectedVersion = projectRow.version;

    await db.insert(generationProposals).values({
      id: proposalId,
      taskId,
      projectId,
      baseProjectVersion: expectedVersion,
      payload: JSON.stringify({
        generatedApi: validatedApi,
        changeSet,
      }),
    });

    const response: GenerateApiResponse = {
      success: true,
      generation: validatedApi,
      changeSet,
      conflicts: changeSet.conflicts,
      detailedPrompt: "Imported from OpenAPI JSON Document.",
      detailedSummary: `Parsed ${validatedApi.endpoints.length} endpoints from OpenAPI.`,
      proposalId,
      expectedVersion,
    };

    return NextResponse.json(response);
  } catch (error) {
    const authResponse = authErrorResponse(error);
    if (authResponse) return authResponse;

    console.error("[Fack API] OpenAPI Import Error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown import error",
      },
      { status: 500 },
    );
  }
}
