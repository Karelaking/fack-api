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
 * Extracts the project namespace slug from the request's subdomain.
 * e.g., "api-v2.localhost:3000" -> "api-v2"
 * Ignores system domains and common system subdomains like www, api, dashboard, admin.
 */
function getProjectSlugFromSubdomain(host: string): string | null {
  if (!host) return null;
  const hostname = host.split(":")[0];

  const appDomain =
    process.env.APP_DOMAIN || process.env.NEXT_PUBLIC_APP_DOMAIN || "";
  const vercelUrl = process.env.VERCEL_URL || "";
  const vercelProdUrl = process.env.VERCEL_PROJECT_PRODUCTION_URL || "";
  const vercelPublicUrl = process.env.NEXT_PUBLIC_VERCEL_URL || "";

  const systemDomains = new Set(
    [
      "localhost",
      "127.0.0.1",
      "fack-api",
      appDomain,
      vercelUrl,
      vercelProdUrl,
      vercelPublicUrl,
    ].filter(Boolean),
  );

  if (systemDomains.has(hostname)) {
    return null;
  }

  let subdomain: string | null = null;

  if (hostname.endsWith(".localhost")) {
    subdomain = hostname.slice(0, -".localhost".length);
  } else if (appDomain && hostname.endsWith("." + appDomain)) {
    subdomain = hostname.slice(0, -("." + appDomain).length);
  } else if (vercelProdUrl && hostname.endsWith("." + vercelProdUrl)) {
    subdomain = hostname.slice(0, -("." + vercelProdUrl).length);
  } else if (vercelUrl && hostname.endsWith("." + vercelUrl)) {
    subdomain = hostname.slice(0, -("." + vercelUrl).length);
  }

  if (!subdomain) return null;

  const ignoredSubdomains = new Set(["www", "api", "dashboard", "admin"]);
  if (ignoredSubdomains.has(subdomain)) {
    return null;
  }

  return subdomain;
}

/**
 * Next.js Proxy function — runs before every matched request.
 */
export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const host = request.headers.get("host") || "";

  // ── Detect System/Dashboard Paths ────────────────────────────────────────
  const isSystemPath =
    pathname === "/" ||
    pathname.startsWith("/_next/") ||
    pathname.startsWith("/dashboard") ||
    pathname.startsWith("/projects/") ||
    pathname.startsWith("/api/typescript/") ||
    pathname.startsWith("/api/mock/") ||
    pathname.match(/\.(?:svg|png|jpg|jpeg|gif|webp|css|js|ico)$/) !== null;

  // ── CORS Preflight ───────────────────────────────────────────────────────
  // Handle OPTIONS requests for mock API paths or custom domain endpoints
  if (request.method === "OPTIONS" && !isSystemPath) {
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

  // ── Subdomain Mock API Rewrite ───────────────────────────────────────────
  const subdomainSlug = getProjectSlugFromSubdomain(host);
  if (subdomainSlug && !isSystemPath) {
    const projectSlug = subdomainSlug.replace(/-/g, "/");
    const url = request.nextUrl.clone();
    url.pathname = `/api/mock/${projectSlug}${pathname}`;

    const response = NextResponse.rewrite(url);
    response.headers.set("X-Accel-Buffering", "no");
    response.headers.set(
      "Cache-Control",
      "no-store, no-cache, must-revalidate, proxy-revalidate",
    );
    response.headers.set("Pragma", "no-cache");
    response.headers.set("Expires", "0");
    return response;
  }

  // ── Mock API Rewrite (No Prefix /mock) ──────────────────────────────────
  if (!isSystemPath) {
    const url = request.nextUrl.clone();
    url.pathname = `/api/mock${pathname}`;

    const response = NextResponse.rewrite(url);
    response.headers.set("X-Accel-Buffering", "no");
    response.headers.set(
      "Cache-Control",
      "no-store, no-cache, must-revalidate, proxy-revalidate",
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
