import type { NextRequest } from "next/server";
import { db } from "@/db";
import { projects } from "@/db/schema";
import { eq } from "drizzle-orm";
import { buildResponse } from "@/lib/mock-engine";
import { processMockRequest } from "@/lib/mock-handler-core";
import { getCachedProjectByDomain, setCachedProjectByDomain } from "@/lib/cache";

export const dynamic = "force-dynamic";

interface RouteContext<T> {
  params: Promise<{
    domain: string;
    slug: string[];
  }>;
}

export async function GET(
  request: NextRequest,
  context: RouteContext<"/api/mock/by-domain/[domain]/[...slug]">
) {
  return handleMockRequest(request, context);
}

export async function POST(
  request: NextRequest,
  context: RouteContext<"/api/mock/by-domain/[domain]/[...slug]">
) {
  return handleMockRequest(request, context);
}

export async function PUT(
  request: NextRequest,
  context: RouteContext<"/api/mock/by-domain/[domain]/[...slug]">
) {
  return handleMockRequest(request, context);
}

export async function DELETE(
  request: NextRequest,
  context: RouteContext<"/api/mock/by-domain/[domain]/[...slug]">
) {
  return handleMockRequest(request, context);
}

export async function PATCH(
  request: NextRequest,
  context: RouteContext<"/api/mock/by-domain/[domain]/[...slug]">
) {
  return handleMockRequest(request, context);
}

async function handleMockRequest(
  request: NextRequest,
  context: RouteContext<"/api/mock/by-domain/[domain]/[...slug]">
): Promise<Response> {
  const startTime = Date.now();

  try {
    const { domain, slug } = await context.params;
    const requestPath = "/" + (slug?.join("/") ?? "");

    // ── Find the Project by Custom Domain ──────────────────────────────
    let project = getCachedProjectByDomain(domain);

    if (!project) {
      project = await db.query.projects.findFirst({
        where: eq(projects.customDomain, domain),
      });

      if (project) {
        setCachedProjectByDomain(domain, project);
      }
    }

    if (!project) {
      return buildResponse(
        {
          error: true,
          message: `Project with custom domain "${domain}" not found`,
          hint: "Ensure the custom domain is mapped to your project in settings.",
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
    console.error("[fack-api] Mock request handler error by domain:", error);
    return buildResponse({ error: true, message: "Internal mock server error" }, 500);
  }
}
