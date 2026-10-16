/**
 * Fack AI API Architect — Validator & Conflict Detection Service
 *
 * Implements Zod schema validation, REST semantic checks, Faker provider
 * verification, route conflict detection, and change set synthesis.
 */

import { z } from "zod/v4";
import type { HttpMethod } from "@/db/schema";
import type {
  GeneratedApi,
  GeneratedEndpoint,
  GeneratedRoute,
  GeneratedProperty,
  ApiChangeSet,
  RouteConflict,
} from "@/lib/ai/types";
import { isValidFakerProvider } from "./faker-providers.constant";
import {
  toProfessionalApiName,
  toProfessionalEndpointName,
} from "./fallback-synthesizer.constant";
import type { RouteWithEndpoint } from "@/lib/services/route.service";
import type { EndpointWithRoutes } from "@/lib/services/endpoint.service";

// ─── Zod Schemas for Structured Output ────────────────────────────────────────

export const generatedPropertySchema: z.ZodType<GeneratedProperty> = z.lazy(
  () =>
    z.object({
      name: z.string().min(1, "Property name cannot be empty"),
      type: z.enum([
        "string",
        "number",
        "integer",
        "boolean",
        "object",
        "array",
      ]),
      fakerProvider: z.string().optional(),
      nullable: z.boolean().optional(),
      children: z.array(generatedPropertySchema).optional(),
      arrayItemType: z
        .enum(["string", "number", "integer", "boolean", "object"])
        .optional(),
      arrayItemFakerProvider: z.string().optional(),
      arrayItemChildren: z.array(generatedPropertySchema).optional(),
    }),
);

export const generatedRouteSchema = z.object({
  method: z.enum(["GET", "POST", "PUT", "DELETE", "PATCH"]),
  path: z.string(),
  statusCode: z.number().int().min(100).max(599).default(200),
  description: z.string().optional(),
  properties: z.array(generatedPropertySchema).default([]),
  latency: z
    .object({
      min: z.number().int().min(0).default(0),
      max: z.number().int().min(0).default(0),
    })
    .default({ min: 0, max: 0 }),
  errorRate: z.number().min(0).max(100).default(0),
  customHeaders: z.record(z.string(), z.string()).optional(),
});

export const generatedEndpointSchema = z.object({
  name: z.string().min(1, "Endpoint name is required"),
  description: z.string().optional(),
  basePath: z.string().default(""),
  routes: z.array(generatedRouteSchema),
});

export const generatedApiSchema = z.object({
  name: z.string().min(1, "API name is required"),
  description: z.string().optional(),
  endpoints: z.array(generatedEndpointSchema),
});

export const detailedPromptSchema = z.object({
  summary: z
    .string()
    .describe("A concise 1-2 sentence executive summary of the API"),
  entities: z
    .array(z.string())
    .describe("List of core domain entity names identified"),
  detailedPrompt: z
    .string()
    .describe(
      "The exhaustive technical markdown specification detailing all endpoints, models, and routes",
    ),
  isAmbiguous: z
    .boolean()
    .optional()
    .describe(
      "True if the prompt is too vague or lacks sufficient domain context to generate a meaningful API without hallucinating",
    ),
  clarificationRequest: z
    .string()
    .optional()
    .describe(
      "If ambiguous, ask a clarifying question to the user to get more details",
    ),
});

// ─── Semantic Validation ──────────────────────────────────────────────────────

export interface ValidationError {
  path: string;
  message: string;
}

export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
  normalizedApi?: GeneratedApi;
}

/**
 * Normalizes and formats a route path:
 * e.g. "users/:id" -> "/:id", or "/users" -> "/users"
 */
export function normalizePath(path: string): string {
  let normalized = path.trim();
  if (!normalized || normalized === "/") {
    return "/";
  }
  if (!normalized.startsWith("/")) {
    normalized = `/${normalized}`;
  }
  // Collapse duplicate slashes
  normalized = normalized.replace(/\/+/g, "/");
  // Strip trailing slash if longer than 1 character
  if (normalized.length > 1 && normalized.endsWith("/")) {
    normalized = normalized.slice(0, -1);
  }
  return normalized || "/";
}

/**
 * Normalizes error rate to 0-100 percentage.
 */
export function normalizeErrorRate(rate: number): number {
  if (rate <= 0) {
    return 0;
  }
  if (rate > 0 && rate <= 1) {
    return Math.round(rate * 100);
  }
  return Math.min(100, Math.max(0, Math.round(rate)));
}

/**
 * Performs deep semantic validation and normalization on a GeneratedApi.
 */
export function validateAndNormalizeApi(api: GeneratedApi): ValidationResult {
  const errors: ValidationError[] = [];
  const normalizedEndpoints: GeneratedEndpoint[] = [];

  const endpointNames = new Set<string>();

  for (const ep of api.endpoints) {
    let trimmedName = ep.name.trim();
    if (!trimmedName) {
      errors.push({
        path: "endpoint.name",
        message: "Endpoint name cannot be empty",
      });
      continue;
    }

    // Elevate lowercase or slug names to professional domain titles
    if (/^[a-z0-9_-]+$/.test(trimmedName)) {
      trimmedName = toProfessionalEndpointName(trimmedName);
    }

    if (endpointNames.has(trimmedName.toLowerCase())) {
      errors.push({
        path: `endpoint.${trimmedName}`,
        message: `Duplicate endpoint name "${trimmedName}" in generated specification`,
      });
    }
    endpointNames.add(trimmedName.toLowerCase());

    let normalizedBasePath = normalizePath(
      ep.basePath || `/${trimmedName.toLowerCase()}`,
    );
    if (normalizedBasePath === "/") {
      normalizedBasePath = `/${trimmedName.toLowerCase()}`;
    }
    const segments = normalizedBasePath.split("/").filter(Boolean);
    if (segments.length === 1 && segments[0].toLowerCase() === "cart") {
      normalizedBasePath = "/carts";
    }

    const normalizedRoutes: GeneratedRoute[] = [];
    const seenRouteKeys = new Set<string>();

    for (const route of ep.routes) {
      let routePath = normalizePath(route.path);
      // If route path starts with base path prefix, strip it to prevent duplicate nesting
      if (routePath.startsWith(normalizedBasePath)) {
        routePath = normalizePath(routePath.slice(normalizedBasePath.length));
      }

      const routeKey = `${route.method} ${routePath}`;
      if (seenRouteKeys.has(routeKey)) {
        errors.push({
          path: `endpoint.${trimmedName}.routes`,
          message: `Duplicate route signature "${routeKey}" within endpoint "${trimmedName}"`,
        });
        continue;
      }
      seenRouteKeys.add(routeKey);

      const latencyMin = Math.max(0, route.latency?.min ?? 0);
      let latencyMax = Math.max(0, route.latency?.max ?? 0);
      if (latencyMin > latencyMax) {
        latencyMax = latencyMin;
      }

      const errorRate = normalizeErrorRate(route.errorRate ?? 0);

      // Validate property faker providers
      const validateProperties = (
        props: GeneratedProperty[],
        propPath: string,
      ) => {
        for (const prop of props) {
          if (prop.fakerProvider && !isValidFakerProvider(prop.fakerProvider)) {
            // Notice: we log a warning or normalize rather than hard-failing
            prop.fakerProvider = "lorem.words";
          }
          if (prop.children) {
            validateProperties(prop.children, `${propPath}.${prop.name}`);
          }
          if (prop.arrayItemChildren) {
            validateProperties(
              prop.arrayItemChildren,
              `${propPath}.${prop.name}[]`,
            );
          }
        }
      };
      validateProperties(
        route.properties,
        `endpoint.${trimmedName}.route[${routeKey}]`,
      );

      normalizedRoutes.push({
        ...route,
        path: routePath,
        statusCode: route.statusCode || (route.method === "POST" ? 201 : 200),
        latency: { min: latencyMin, max: latencyMax },
        errorRate,
      });
    }

    normalizedEndpoints.push({
      ...ep,
      name: trimmedName,
      basePath: normalizedBasePath,
      routes: normalizedRoutes,
    });
  }

  // Normalize API Title to professional standards
  let normalizedApiName = api.name ? api.name.trim() : "";
  const lazyNames = [
    "api",
    "my api",
    "test api",
    "untitled api",
    "sample api",
    "test",
    "new api",
  ];
  if (
    !normalizedApiName ||
    lazyNames.includes(normalizedApiName.toLowerCase())
  ) {
    normalizedApiName = toProfessionalApiName(
      normalizedEndpoints.map((e) => e.name).join(" "),
      normalizedEndpoints.map((e) => e.name),
    );
  } else {
    normalizedApiName = normalizedApiName
      .replace(/\bapi\b/gi, "API")
      .replace(/\s+/g, " ")
      .trim();
    if (normalizedApiName.length > 0) {
      normalizedApiName =
        normalizedApiName.charAt(0).toUpperCase() + normalizedApiName.slice(1);
    }
    if (
      !normalizedApiName.toUpperCase().endsWith("API") &&
      !normalizedApiName.toUpperCase().endsWith("PLATFORM")
    ) {
      normalizedApiName = `${normalizedApiName} Platform API`;
    }
  }

  const isValid = errors.length === 0;
  const normalizedApi: GeneratedApi = {
    ...api,
    name: normalizedApiName,
    endpoints: normalizedEndpoints,
  };

  return {
    isValid,
    errors,
    normalizedApi,
  };
}

// ─── Conflict Detection & Change Set Synthesis ───────────────────────────────

/**
 * Detects conflicts between proposed generated routes and existing project routes.
 */
export function detectRouteConflicts(
  proposedApi: GeneratedApi,
  existingRoutes: RouteWithEndpoint[],
): RouteConflict[] {
  const conflicts: RouteConflict[] = [];

  // Map existing routes by full method + full path
  const existingMap = new Map<string, RouteWithEndpoint>();
  for (const r of existingRoutes) {
    const fullPath = normalizePath(`${r.endpoint.basePath}${r.path}`);
    const key = `${r.method}:${fullPath}`;
    existingMap.set(key, r);
  }

  for (const ep of proposedApi.endpoints) {
    for (const route of ep.routes) {
      const proposedFullPath = normalizePath(`${ep.basePath}${route.path}`);
      const key = `${route.method}:${proposedFullPath}`;
      const existing = existingMap.get(key);

      if (existing) {
        conflicts.push({
          endpointName: ep.name,
          existingRouteId: existing.id,
          method: route.method,
          path: proposedFullPath,
          proposedRoute: route,
          suggestedResolution: "replace",
        });
      }
    }
  }

  return conflicts;
}

/**
 * Builds a comprehensive ApiChangeSet comparing proposed API to existing project state.
 */
export function buildApiChangeSet(
  proposedApi: GeneratedApi,
  existingEndpoints: EndpointWithRoutes[],
  existingRoutes: RouteWithEndpoint[],
  resolutions: Record<string, "replace" | "skip" | "modify"> = {},
): ApiChangeSet {
  const conflicts = detectRouteConflicts(proposedApi, existingRoutes);
  const conflictMap = new Map<string, RouteConflict>();
  for (const c of conflicts) {
    const key = `${c.method}:${c.path}`;
    conflictMap.set(key, c);
  }

  const existingEndpointMap = new Map<string, EndpointWithRoutes>();
  for (const ep of existingEndpoints) {
    existingEndpointMap.set(ep.name.trim().toLowerCase(), ep);
  }

  const endpointsToCreate: GeneratedEndpoint[] = [];
  const routesToCreate: Array<{
    endpointName: string;
    endpointId?: string;
    route: GeneratedRoute;
  }> = [];
  const routesToUpdate: Array<{
    routeId: string;
    existingMethod: HttpMethod;
    existingPath: string;
    proposedRoute: GeneratedRoute;
  }> = [];

  let totalFields = 0;

  for (const ep of proposedApi.endpoints) {
    const existingEp = existingEndpointMap.get(ep.name.trim().toLowerCase());
    if (!existingEp) {
      endpointsToCreate.push(ep);
    }

    for (const route of ep.routes) {
      totalFields += route.properties.length;
      const fullPath = normalizePath(`${ep.basePath}${route.path}`);
      const conflictKey = `${route.method}:${fullPath}`;
      const conflict = conflictMap.get(conflictKey);

      if (conflict) {
        const resolution =
          resolutions[conflictKey] || conflict.suggestedResolution;
        conflict.resolvedResolution = resolution;

        if (resolution === "replace") {
          routesToUpdate.push({
            routeId: conflict.existingRouteId,
            existingMethod: conflict.method,
            existingPath: conflict.path,
            proposedRoute: route,
          });
        } else if (resolution === "modify") {
          // Suffix path to avoid collision e.g. /products/new
          const modifiedRoute = {
            ...route,
            path: `${route.path}/v2`,
          };
          routesToCreate.push({
            endpointName: ep.name,
            endpointId: existingEp?.id,
            route: modifiedRoute,
          });
        }
        // If "skip", do nothing
      } else {
        routesToCreate.push({
          endpointName: ep.name,
          endpointId: existingEp?.id,
          route,
        });
      }
    }
  }

  return {
    endpointsToCreate,
    routesToCreate,
    routesToUpdate,
    routesToDelete: [],
    conflicts,
    summary: {
      endpointsCount: proposedApi.endpoints.length,
      routesCount: proposedApi.endpoints.reduce(
        (acc, ep) => acc + ep.routes.length,
        0,
      ),
      fieldsCount: totalFields,
      conflictsCount: conflicts.length,
    },
  };
}
