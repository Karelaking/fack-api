/**
 * Fack API's — TypeScript Interface Download Handler
 *
 * API route that generates and serves TypeScript type definitions
 * for a specific mock route's response schema.
 *
 * Usage:
 *   GET /api/typescript/:routeId
 *   → Returns a .d.ts file as a downloadable attachment
 *
 * The generated TypeScript interface matches exactly the JSON Schema
 * configured for the route in the dashboard, ensuring perfect parity
 * between mock data shape and frontend type definitions.
 */

import type { NextRequest } from "next/server";
import { db } from "@/db";
import { routes } from "@/db/schema";
import { eq } from "drizzle-orm";
import { generateTypeScript } from "@/lib/ts-generator";

/**
 * Handles GET requests to generate and download TypeScript interfaces.
 *
 * @param request - The incoming request
 * @param context - Route context with the routeId parameter
 * @returns TypeScript source code as a downloadable .d.ts file
 */
export async function GET(
  request: NextRequest,
  context: RouteContext<"/api/typescript/[routeId]">
) {
  try {
    const { routeId } = await context.params;

    // ── 1. Retrieve the Route ────────────────────────────────────────────
    const route = await db.query.routes.findFirst({
      where: eq(routes.id, routeId),
      with: {
        endpoint: true,
      },
    });

    if (!route) {
      return Response.json(
        { error: true, message: `Route "${routeId}" not found` },
        { status: 404 }
      );
    }

    // ── 2. Parse the JSON Schema ─────────────────────────────────────────
    let schema: Record<string, unknown> = {};
    try {
      schema = JSON.parse(route.responseSchema ?? "{}");
    } catch {
      return Response.json(
        {
          error: true,
          message: "Route has an invalid JSON Schema. Please fix it in the dashboard.",
        },
        { status: 422 }
      );
    }

    // ── 3. Generate TypeScript Interface ─────────────────────────────────
    // Derive a meaningful type name from the route path
    const typeName = deriveTypeName(route.method, route.path);
    const typescript = await generateTypeScript(schema, { typeName });

    // ── 4. Return as Downloadable File ───────────────────────────────────
    const fileName = `${typeName}.d.ts`;

    return new Response(typescript, {
      status: 200,
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Content-Disposition": `attachment; filename="${fileName}"`,
        "X-Powered-By": "Fack API's",
      },
    });
  } catch (error) {
    console.error("[fack-api] TypeScript generation error:", error);
    return Response.json(
      { error: true, message: "Failed to generate TypeScript interface" },
      { status: 500 }
    );
  }
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

/**
 * Derives a PascalCase TypeScript interface name from HTTP method and route path.
 *
 * @param method - HTTP method (e.g., "GET")
 * @param path - Route path (e.g., "/users/:id/profile")
 * @returns A PascalCase type name (e.g., "GetUsersProfileResponse")
 *
 * @example
 * ```ts
 * deriveTypeName("GET", "/users")            // → "GetUsersResponse"
 * deriveTypeName("POST", "/users/:id")       // → "PostUsersResponse"
 * deriveTypeName("GET", "/")                 // → "GetRootResponse"
 * ```
 */
function deriveTypeName(method: string, path: string): string {
  const segments = path
    .split("/")
    .filter(Boolean)
    .filter((s) => !s.startsWith(":")) // Remove dynamic segments
    .map((s) => s.charAt(0).toUpperCase() + s.slice(1).toLowerCase());

  const pathPart = segments.length > 0 ? segments.join("") : "Root";
  const methodPart = method.charAt(0).toUpperCase() + method.slice(1).toLowerCase();

  return `${methodPart}${pathPart}Response`;
}
