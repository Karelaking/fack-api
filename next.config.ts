import type { NextConfig } from "next";

/**
 * Next.js Configuration for Fack API's
 *
 * Key settings:
 * - `output: "standalone"` — Enables optimized Docker builds by tracing only
 *   the files needed for production, reducing image size significantly.
 */
const nextConfig: NextConfig = {
  output: "standalone",
  typedRoutes: true,
  allowedDevOrigins: ["192.168.29.142"],
};

export default nextConfig;
