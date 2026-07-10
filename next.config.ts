import type { NextConfig } from "next";

/**
 * Next.js Configuration for Fack API's
 *
 * Key settings:
 * - `output: "standalone"` — Enables optimized Docker builds by tracing only
 *   the files needed for production, reducing image size significantly.
 * - `serverExternalPackages` — Excludes `better-sqlite3` from webpack bundling
 *   since it's a native Node.js addon that must be loaded at runtime.
 */
const nextConfig: NextConfig = {
  output: "standalone",
  typedRoutes: true,
  serverExternalPackages: ["better-sqlite3"],
};

export default nextConfig;
