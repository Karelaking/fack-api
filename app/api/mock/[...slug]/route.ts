import type { NextRequest } from "next/server";
import { db } from "@/db";
import { projects } from "@/db/schema";
import { eq } from "drizzle-orm";
import { buildResponse } from "@/lib/mock-engine";
import { processMockRequest } from "@/lib/mock-handler-core";
import { getCachedProjectBySlug, setCachedProjectBySlug } from "@/lib/cache";

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
    let project = null;
    let requestPath = "";

    // Candidate prefixes from longest to shortest
    const candidates: string[] = [];
    for (let i = slug.length; i > 0; i--) {
      candidates.push(slug.slice(0, i).join("/"));
    }

    // Try finding in cache first
    for (const candidate of candidates) {
      const cached = getCachedProjectBySlug(candidate);
      if (cached) {
        project = cached;
        const slugCount = candidate.split("/").length;
        requestPath = "/" + slug.slice(slugCount).join("/");
        break;
      }
    }

    // Fallback to database query if not cached
    if (!project) {
      for (let i = slug.length; i > 0; i--) {
        const candidateSlug = slug.slice(0, i).join("/");
        console.log("[fack-api] Checking candidate slug:", candidateSlug);
        const foundProject = await db.query.projects.findFirst({
          where: eq(projects.slug, candidateSlug),
        });
        if (foundProject) {
          console.log("[fack-api] Resolved project slug (DB):", foundProject.slug);
          project = foundProject;
          requestPath = "/" + slug.slice(i).join("/");
          setCachedProjectBySlug(candidateSlug, foundProject);
          break;
        }
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
