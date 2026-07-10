/**
 * Fack API's — Proxy (formerly Middleware in Next.js < 16)
 *
 * This is the edge-level request interceptor for the platform.
 * In Next.js 16, `middleware.ts` was renamed to `proxy.ts` and the
 * exported function must be named `proxy`.
 *
 * Responsibilities:
 * 1. Intercepts requests to `/mock/:projectId/*` paths
 * 2. Rewrites them to the internal catch-all API route handler
 * 3. Handles CORS preflight (OPTIONS) requests globally
 * 4. Skips dashboard routes, static assets, and API routes
 *
 * The proxy acts transparently — the consuming frontend application
 * never sees the internal rewrite, maintaining the illusion of a
 * real API server at the mock endpoint URL.
 *
 * @see https://nextjs.org/docs/app/api-reference/file-conventions/proxy
 */

import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/**
 * Next.js Proxy function — runs before every matched request.
 *
 * Flow:
 * 1. Check if the request is a CORS preflight → return 204 with CORS headers
 * 2. Check if the path matches `/mock/:projectId/...` → rewrite to catch-all handler
 * 3. Otherwise → pass through to Next.js (dashboard, static files, etc.)
 */
export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // ── CORS Preflight ───────────────────────────────────────────────────────
  // Handle OPTIONS requests for mock API paths to prevent browser CORS errors
  if (request.method === "OPTIONS" && pathname.startsWith("/mock/")) {
    return new NextResponse(null, {
      status: 204,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods":
          "GET, POST, PUT, DELETE, PATCH, OPTIONS",
        "Access-Control-Allow-Headers":
          "Content-Type, Authorization, X-Requested-With",
        "Access-Control-Max-Age": "86400",
      },
    });
  }

  // ── Mock API Rewrite ─────────────────────────────────────────────────────
  // Match: /mock/{projectId}/{...rest}
  // Rewrite to: /api/mock/{projectId}/{...rest}
  //
  // This transparent rewrite lets the frontend consume URLs like:
  //   http://localhost:3000/mock/my-project/users/123
  // which internally routes to:
  //   /api/mock/my-project/users/123 (the catch-all route handler)
  if (pathname.startsWith("/mock/")) {
    const url = request.nextUrl.clone();
    url.pathname = `/api${pathname}`;

    // Add anti-buffering header for reverse proxy compatibility (Nginx, Traefik)
    const response = NextResponse.rewrite(url);
    response.headers.set("X-Accel-Buffering", "no");
    return response;
  }

  // ── Pass Through ─────────────────────────────────────────────────────────
  // All other requests (dashboard, static files, etc.) proceed normally
  return NextResponse.next();
}

/**
 * Proxy matcher configuration.
 *
 * Only runs the proxy function on paths that could be mock API requests
 * or dashboard pages. Excludes static assets and Next.js internals
 * for optimal performance.
 */
export const config = {
  matcher: [
    /*
     * Match all paths except:
     * - _next/static (static files)
     * - _next/image (image optimization)
     * - favicon.ico and other root-level static files
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
