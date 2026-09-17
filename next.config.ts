import type { NextConfig } from "next";

/**
 * Next.js Configuration for Fack API's
 *
 * Key settings:
 * - `output: "standalone"` — Enables optimized Docker builds by tracing only
 *   the files needed for production. Omitted on Vercel deployments to prevent
 *   conflicts with Vercel's build adapter (ENOENT next-server.js.nft.json).
 */
const nextConfig: NextConfig = {
  ...(process.env.VERCEL ? {} : { output: "standalone" }),
  typedRoutes: true,
  allowedDevOrigins: ["192.168.29.142"],
};

export default nextConfig;
