import type { NextRequest } from "next/server";
import { buildResponse } from "@/lib/mock-engine";
import { processMockRequest } from "@/lib/mock-handler-core";
import { resolveProjectFromSlug } from "@/lib/services/project-resolver.service";
import { LoggerRegistry } from "@/lib/logger-registry";
import { getMockJwtSecret } from "@/lib/mock-jwt";

export const dynamic = "force-dynamic";

interface RouteContext {
  params: Promise<{
    slug: string[];
  }>;
}

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

    const resolution = await resolveProjectFromSlug(slug);
    if (!resolution) {
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
    const { project, requestPath } = resolution;

    // ── System Auth Endpoint Interception ──────────────────────────────
    if (requestPath === "/_auth/token" && request.method === "POST") {
      const { SignJWT } = await import("jose");
      // Shares the exact same resolution as the verify side so minted tokens
      // validate; requires JWT_SECRET in production.
      const secret = getMockJwtSecret(project.id);

      let body: Record<string, unknown> = {};
      try {
        body = await request.clone().json();
      } catch {}

      const payload = {
        sub: String(body.userId || "mock_user_123"),
        email: String(body.email || "user@example.com"),
        role: String(body.role || "user"),
        ...body,
      };

      const token = await new SignJWT(payload)
        .setProtectedHeader({ alg: "HS256" })
        .setIssuedAt()
        .setIssuer(`fack-api:${project.slug}`)
        .setExpirationTime("1h")
        .sign(secret);

      return buildResponse(
        { token, type: "Bearer", expiresIn: 3600, payload },
        200,
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
