/**
 * Fack API's — Mock Response Engine
 *
 * Core of the Data Plane — generates realistic fake API responses
 * from JSON Schema definitions. This module orchestrates:
 *
 * 1. **Payload Generation** — Uses `json-schema-faker` (JSF) with registered
 *    Faker.js providers to produce data matching the schema constraints.
 *
 * 2. **Chaos Simulation** — Injects configurable network latency and
 *    probabilistic error responses to test frontend resilience.
 *
 * 3. **Response Building** — Constructs properly formatted HTTP responses
 *    with CORS headers, custom headers, and correct status codes.
 *
 * Architecture:
 * ```
 * Request → Route Matcher → Mock Engine → Response
 *                              ├─ generatePayload()
 *                              ├─ applyLatency()
 *                              ├─ shouldError()
 *                              └─ buildResponse()
 * ```
 *
 * @see https://github.com/json-schema-faker/json-schema-faker
 * @see https://fakerjs.dev/
 */

import { generate } from "json-schema-faker";
import { faker } from "@faker-js/faker";

// ─── Types ───────────────────────────────────────────────────────────────────

/** Configuration for chaos simulation on a per-route basis */
export interface ChaosConfig {
  /** Minimum simulated latency in milliseconds (0 = no delay) */
  latencyMin: number;
  /** Maximum simulated latency in milliseconds (0 = no delay) */
  latencyMax: number;
  /** Percentage chance of returning an error (0-100) */
  errorRate: number;
}

/** Custom header key-value pairs to inject into the response */
export type CustomHeaders = Record<string, string>;

// ─── Payload Generation ──────────────────────────────────────────────────────

/**
 * Generates a fake data payload from a JSON Schema document.
 *
 * The schema should contain standard JSON Schema type definitions
 * and optionally `x-faker` extension keywords pointing to Faker.js methods.
 *
 * @param schema - A JSON Schema document (parsed from the route's responseSchema)
 * @returns A generated data object conforming to the schema
 *
 * @example
 * ```ts
 * const schema = {
 *   type: "object",
 *   properties: {
 *     id: { type: "string", "x-faker": "string.uuid" },
 *     name: { type: "string", "x-faker": "person.fullName" },
 *     age: { type: "integer", minimum: 18, maximum: 99 }
 *   },
 *   required: ["id", "name", "age"]
 * };
 *
 * const payload = await generatePayload(schema);
 * // → { id: "a1b2c3d4-...", name: "John Smith", age: 34 }
 * ```
 */
export async function generatePayload(
  schema: Record<string, unknown>
): Promise<unknown> {
  try {
    const result = await generate(schema as Parameters<typeof generate>[0], {
      alwaysFakeOptionals: true,
      useDefaultValue: true,
      minItems: 1,
      maxItems: 5,
      extensions: {
        faker,
      },
    });
    return result;
  } catch (error) {
    console.error("[fack-api] Payload generation failed:", error);
    // Return a minimal fallback rather than crashing the request
    return { error: "Failed to generate mock data", details: String(error) };
  }
}

// ─── Chaos Simulation ────────────────────────────────────────────────────────

/**
 * Applies simulated network latency by pausing execution.
 *
 * The actual delay is a random value between `min` and `max` milliseconds.
 * If both values are 0, no delay is applied.
 *
 * This is critical for testing:
 * - Loading states and skeleton UIs
 * - React Suspense boundaries
 * - Request timeout handling
 * - Debounced/throttled API calls
 *
 * @param min - Minimum delay in milliseconds
 * @param max - Maximum delay in milliseconds
 */
export async function applyLatency(min: number, max: number): Promise<void> {
  if (min <= 0 && max <= 0) return;

  const effectiveMin = Math.max(0, min);
  const effectiveMax = Math.max(effectiveMin, max);
  const delay =
    Math.floor(Math.random() * (effectiveMax - effectiveMin + 1)) + effectiveMin;

  await new Promise((resolve) => setTimeout(resolve, delay));
}

/**
 * Determines whether an error should be injected for this request
 * based on the configured error rate percentage.
 *
 * Uses Math.random() for probabilistic error injection:
 * - errorRate = 0 → never errors
 * - errorRate = 50 → errors ~50% of the time
 * - errorRate = 100 → always errors
 *
 * @param errorRate - Percentage chance of error (0-100)
 * @returns true if an error should be simulated
 */
export function shouldError(errorRate: number): boolean {
  if (errorRate <= 0) return false;
  if (errorRate >= 100) return true;
  return Math.random() * 100 < errorRate;
}

// ─── Response Building ───────────────────────────────────────────────────────

/**
 * Default CORS headers applied to every mock API response.
 * These ensure frontend applications on different ports/domains
 * can consume the mock API without browser security violations.
 */
const CORS_HEADERS: Record<string, string> = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, PATCH, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Requested-With",
  "Access-Control-Max-Age": "86400",
};

/**
 * Builds a complete HTTP Response object with the generated payload,
 * CORS headers, custom user-defined headers, and the configured status code.
 *
 * @param payload - The generated mock data to send as the response body
 * @param statusCode - HTTP status code (default: 200)
 * @param customHeaders - Additional headers defined by the user
 * @returns A standard Response object ready to return from a route handler
 */
export function buildResponse(
  payload: unknown,
  statusCode: number = 200,
  customHeaders: CustomHeaders = {}
): Response {
  const headers = new Headers({
    "Content-Type": "application/json",
    "X-Powered-By": "Fack API's",
    "X-Accel-Buffering": "no", // Prevents reverse proxy buffering
    ...CORS_HEADERS,
    ...customHeaders,
  });

  return new Response(JSON.stringify(payload, null, 2), {
    status: statusCode,
    headers,
  });
}

/**
 * Builds a CORS preflight response for OPTIONS requests.
 * This is returned by the proxy layer before the request reaches
 * the route handler, ensuring browser CORS checks pass.
 *
 * @returns A 204 No Content response with CORS headers
 */
export function buildCorsPreflightResponse(): Response {
  return new Response(null, {
    status: 204,
    headers: new Headers(CORS_HEADERS),
  });
}

/**
 * Builds a standardized error response for simulated failures.
 *
 * @param statusCode - HTTP error status code (e.g., 500, 429, 503)
 * @param message - Human-readable error message
 * @returns A JSON error response
 */
export function buildErrorResponse(
  statusCode: number = 500,
  message: string = "Internal Server Error"
): Response {
  return buildResponse(
    {
      error: true,
      statusCode,
      message,
      timestamp: new Date().toISOString(),
    },
    statusCode
  );
}
