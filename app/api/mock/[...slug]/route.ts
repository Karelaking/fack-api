import type { NextRequest } from "next/server";
import { db } from "@/db";
import { projects } from "@/db/schema";
import { eq } from "drizzle-orm";
import { buildResponse } from "@/lib/mock-engine";
import { processMockRequest } from "@/lib/mock-handler-core";
import { getCachedProjectBySlug, setCachedProjectBySlug } from "@/lib/cache";
import { LoggerRegistry } from "@/lib/logger-registry";

export const dynamic = "force-dynamic";

interface RouteContext {
  params: Promise<{
    slug: string[];
  }>;
}

const mockLogger = LoggerRegistry.get("mock");
const mockTrace = LoggerRegistry.getTrace("mock");

function createHandler(method: string) {
  return async function (request: NextRequest, context: RouteContext) {
    mockTrace.traceCall(method, request.nextUrl.pathname);
    const res = await handleMockRequest(request, context);
    mockTrace.traceSuccess(method, `Status: ${res.status}`);
    return res;
  };
}

export const GET = createHandler("GET");
export const POST = createHandler("POST");
export const PUT = createHandler("PUT");
export const DELETE = createHandler("DELETE");
export const PATCH = createHandler("PATCH");

async function handleMockRequest(
  request: NextRequest,
  context: RouteContext,
): Promise<Response> {
  mockTrace.traceCall(
    "handleMockRequest",
    request.method,
    request.nextUrl.pathname,
  );
  const startTime = Date.now();

  try {
    const { slug } = await context.params;
    if (!slug || slug.length === 0) {
      mockTrace.traceSuccess("handleMockRequest (missing slug)", "400");
      return buildResponse(
        { error: true, message: "No path segments provided" },
        400,
      );
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
        mockLogger.debug(`Resolved project slug from cache: ${candidate}`);
        break;
      }
    }

    // Fallback to database query if not cached
    if (!project) {
      for (let i = slug.length; i > 0; i--) {
        const candidateSlug = slug.slice(0, i).join("/");
        mockLogger.debug(`Checking candidate slug: ${candidateSlug}`);
        const foundProject = await db.query.projects.findFirst({
          where: eq(projects.slug, candidateSlug),
        });
        if (foundProject) {
          mockLogger.info(`Resolved project slug (DB): ${foundProject.slug}`);
          project = foundProject;
          requestPath = "/" + slug.slice(i).join("/");
          setCachedProjectBySlug(candidateSlug, foundProject);
          break;
        }
      }
    }

    if (!project) {
      const fullPath = slug.join("/");
      mockTrace.traceSuccess("handleMockRequest (project not found)", "404");
      return buildResponse(
        {
          error: true,
          message: `Workspace namespace matching path "/${fullPath}" not found`,
          hint: "Check that your namespace slug and endpoint paths are correctly configured.",
        },
        404,
      );
    }

    const res = await processMockRequest({
      project,
      requestPath,
      request,
      startTime,
    });
    mockTrace.traceSuccess(
      "handleMockRequest (processed)",
      `Status: ${res.status}`,
    );
    return res;
  } catch (error) {
    mockTrace.traceError("handleMockRequest", error);
    return buildResponse(
      { error: true, message: "Internal mock server error" },
      500,
    );
  }
}
