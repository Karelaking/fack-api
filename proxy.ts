/**
 * Fack API's — Proxy (formerly Middleware in Next.js < 16)
 *
 * This is the edge-level request interceptor for the platform.
 * In Next.js 16, `middleware.ts` was renamed to `proxy.ts` and the
 * exported function must be named `proxy`.
 */

import { NextResponse, type NextRequest } from "next/server";
import { LoggerRegistry } from "@/lib/logger-registry";

const proxyTrace = LoggerRegistry.getTrace("proxy");

/**
 * Extracts the project namespace slug from the request's subdomain.
 * e.g., "api-v2.localhost:3000" -> "api-v2"
 * Ignores system domains and common system subdomains like www, api, dashboard, admin.
 */
function getProjectSlugFromSubdomain(host: string): string | null {
  proxyTrace.traceCall("getProjectSlugFromSubdomain", host);
  if (!host) {
    proxyTrace.traceSuccess("getProjectSlugFromSubdomain", null);
    return null;
  }
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
    proxyTrace.traceSuccess(
      "getProjectSlugFromSubdomain (system domain)",
      null,
    );
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

  if (!subdomain) {
    proxyTrace.traceSuccess(
      "getProjectSlugFromSubdomain (no subdomain match)",
      null,
    );
    return null;
  }

  const ignoredSubdomains = new Set(["www", "api", "dashboard", "admin"]);
  if (ignoredSubdomains.has(subdomain)) {
    proxyTrace.traceSuccess(
      "getProjectSlugFromSubdomain (ignored subdomain)",
      null,
    );
    return null;
  }

  proxyTrace.traceSuccess("getProjectSlugFromSubdomain", subdomain);
  return subdomain;
}

import {
  clerkMiddleware,
  type ClerkMiddlewareAuth,
} from "@clerk/nextjs/server";

// Force Turbopack/Webpack to statically analyze and inline these variables into the Edge bundle
// const _dummyPublishableKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;
// const _dummySecretKey = process.env.CLERK_SECRET_KEY;

/**
 * Next.js Proxy function — runs before every matched request.
 *
 * Wrapped with clerkMiddleware so Clerk populates the auth context for the
 * request. Auth is NOT enforced here: path matching in middleware can diverge
 * from how Next.js resolves routes (see Clerk's createRouteMatcher
 * deprecation). Protected pages instead call `auth.protect()` in the layout
 * that wraps them, and API routes call the guards in `lib/auth.ts`.
 */
const clerkProxyHandler = async (
  _auth: ClerkMiddlewareAuth,
  request: NextRequest,
) => {
  const { pathname } = request.nextUrl;
  const host = request.headers.get("host") || "";
  proxyTrace.traceCall("proxy", request.method, pathname, host);

  // ── Detect System/Dashboard Paths ────────────────────────────────────────
  const systemPrefixes = [
    "/dashboard",
    "/activity",
    "/analytics",
    "/domains",
    "/keys",
    "/settings",
    "/projects",
    "/api/typescript",
    "/api/mock",
    "/api/ai",
    "/api/import",
    "/api/projects",
    "/_next",
    "/opengraph-image",
    "/sign-in",
    "/sign-up",
  ];

  const systemExactPaths = new Set(["/", "/robots.txt", "/sitemap.xml"]);

  const isSystemPath =
    systemExactPaths.has(pathname) ||
    systemPrefixes.some(
      (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
    ) ||
    /\.(?:svg|png|jpg|jpeg|gif|webp|css|js|ico|txt|xml|json)$/.test(pathname);

  // ── CORS Preflight ───────────────────────────────────────────────────────
  // Handle OPTIONS requests for mock API paths or custom domain endpoints
  if (request.method === "OPTIONS" && !isSystemPath) {
    proxyTrace.traceSuccess("proxy (CORS Preflight OPTIONS)", "204");
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
    const projectSlug = subdomainSlug;
    const url = request.nextUrl.clone();
    url.pathname = `/api/mock/${projectSlug}${pathname}`;

    proxyTrace.traceSuccess("proxy (Subdomain rewrite)", url.pathname);
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

    proxyTrace.traceSuccess("proxy (Standard path rewrite)", url.pathname);
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
  proxyTrace.traceSuccess("proxy (Pass through)", "NextResponse.next()");
  return NextResponse.next();
};

/**
 * Next.js Proxy entrypoint.
 *
 * The Clerk options below point server-side redirects at the app's own auth
 * pages. `auth.protect()` (used in the dashboard/project layouts) resolves its
 * redirect target from these options, else from the
 * NEXT_PUBLIC_CLERK_SIGN_IN_URL / _SIGN_UP_URL env vars, else from the Clerk
 * instance default — which is the hosted Account Portal. Passing them here
 * keeps unauthenticated redirects inside the app instead of bouncing to the
 * prebuilt Account Portal pages.
 */
export const proxy = clerkMiddleware(clerkProxyHandler, {
  signInUrl: "/sign-in",
  signUpUrl: "/sign-up",
});

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
