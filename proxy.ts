/**
 * Fack API's — Proxy (formerly Middleware in Next.js < 16)
 *
 * This is the edge-level request interceptor for the platform.
 * In Next.js 16, `middleware.ts` was renamed to `proxy.ts` and the
 * exported function must be named `proxy`.
 *
 * Responsibilities:
 * 1. Detect and handle custom domain requests by mapping them to their projects.
 * 2. Intercepts requests to `/mock/:projectId/*` paths.
 * 3. Rewrites them to the internal catch-all API route handler.
 * 4. Handles CORS preflight (OPTIONS) requests globally.
 * 5. Skips dashboard routes, static assets, and API routes.
 *
 * The proxy acts transparently — the consuming frontend application
 * never sees the internal rewrite, maintaining the illusion of a
 * real API server at the mock endpoint URL.
 */

import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/**
 * Checks if the host header represents a custom domain instead of a
 * system/dashboard domain.
 */
function isCustomDomain(host: string) {
  if (!host) return false;
  // Strip port from Host header if present
  const hostname = host.split(":")[0];

  const systemDomains = new Set(
    [
      "localhost",
      "127.0.0.1",
      "fack-api",
      process.env.APP_DOMAIN || "",
    ].filter(Boolean)
  );

  return !systemDomains.has(hostname);
}

/**
 * Next.js Proxy function — runs before every matched request.
 */
export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const host = request.headers.get("host") || "";

  // ── CORS Preflight ───────────────────────────────────────────────────────
  // Handle OPTIONS requests for mock API paths or custom domain endpoints
  if (
    request.method === "OPTIONS" &&
    (pathname.startsWith("/mock/") || isCustomDomain(host))
  ) {
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

  // ── Custom Domain Handling ───────────────────────────────────────────────
  if (isCustomDomain(host)) {
    // Avoid rewriting Next.js internals, static files, and database routes
    if (
      !pathname.startsWith("/_next/") &&
      !pathname.startsWith("/api/mock/by-domain/") &&
      !pathname.match(/\.(?:svg|png|jpg|jpeg|gif|webp|css|js|ico)$/)
    ) {
      const hostname = host.split(":")[0];
      const url = request.nextUrl.clone();
      url.pathname = `/api/mock/by-domain/${hostname}${pathname}`;

      const response = NextResponse.rewrite(url);
      response.headers.set("X-Accel-Buffering", "no");
      response.headers.set(
        "Cache-Control",
        "no-store, no-cache, must-revalidate, proxy-revalidate"
      );
      response.headers.set("Pragma", "no-cache");
      response.headers.set("Expires", "0");
      return response;
    }
  }

  // ── Mock API Rewrite ─────────────────────────────────────────────────────
  // Match: /mock/{projectId}/{...rest}
  // Rewrite to: /api/mock/{projectId}/{...rest}
  if (pathname.startsWith("/mock/")) {
    const url = request.nextUrl.clone();
    url.pathname = `/api${pathname}`;

    const response = NextResponse.rewrite(url);
    response.headers.set("X-Accel-Buffering", "no");
    response.headers.set(
      "Cache-Control",
      "no-store, no-cache, must-revalidate, proxy-revalidate"
    );
    response.headers.set("Pragma", "no-cache");
    response.headers.set("Expires", "0");
    return response;
  }

  // ── Pass Through ─────────────────────────────────────────────────────────
  // All other requests (dashboard, static files, etc.) proceed normally
  return NextResponse.next();
}

/**
 * Proxy matcher configuration.
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
