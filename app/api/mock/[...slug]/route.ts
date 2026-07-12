import type { NextRequest } from "next/server";
import { db } from "@/db";
import { projects } from "@/db/schema";
import { eq } from "drizzle-orm";
import { buildResponse } from "@/lib/mock-engine";
import { processMockRequest } from "@/lib/mock-handler-core";

export const dynamic = "force-dynamic";

interface RouteContext {
  params: Promise<{
    slug: string[];
  }>;
}

export async function GET(request: NextRequest, context: RouteContext) {
  return handleMockRequest(request, context);
}

export async function POST(request: NextRequest, context: RouteContext) {
  return handleMockRequest(request, context);
}

export async function PUT(request: NextRequest, context: RouteContext) {
  return handleMockRequest(request, context);
}

export async function DELETE(request: NextRequest, context: RouteContext) {
  return handleMockRequest(request, context);
}

export async function PATCH(request: NextRequest, context: RouteContext) {
  return handleMockRequest(request, context);
}

async function handleMockRequest(
  request: NextRequest,
  context: RouteContext
): Promise<Response> {
  const startTime = Date.now();

  try {
    const { slug } = await context.params;
    if (!slug || slug.length === 0) {
      return buildResponse({ error: true, message: "No path segments provided" }, 400);
    }

    // ── Find the Project and Request Path ──────────────────────────────
    // Candidate prefixes from longest to shortest
    // e.g. for ["api", "v1", "users"], candidates are: "api/v1/users", "api/v1", "api"
    let project = null;
    let requestPath = "";

    for (let i = slug.length; i > 0; i--) {
      const candidateSlug = slug.slice(0, i).join("/");
      console.log("[fack-api] Checking candidate slug:", candidateSlug);
      const foundProject = await db.query.projects.findFirst({
        where: eq(projects.slug, candidateSlug),
      });
      if (foundProject) {
        console.log("[fack-api] Resolved project slug:", foundProject.slug);
        project = foundProject;
        requestPath = "/" + slug.slice(i).join("/");
        break;
      }
    }

    if (!project) {
      const fullPath = slug.join("/");
      return buildResponse(
        {
          error: true,
          message: `Workspace namespace matching path "/${fullPath}" not found`,
          hint: "Check that your namespace slug and endpoint paths are correctly configured.",
        },
        404
      );
    }

    return await processMockRequest({
      project,
      requestPath,
      request,
      startTime,
    });
  } catch (error) {
    console.error("[fack-api] Mock request handler error:", error);
    return buildResponse({ error: true, message: "Internal mock server error" }, 500);
  }
}
