/**
 * Fack AI API Architect — Agent Tools Service
 *
 * Implements the 11 PRD agent tools for project inspection, staged API design,
 * schema synthesis, route validation, and canvas reconciliation.
 *
 * All operations call the Domain Service layer, maintaining complete
 * isolation from direct database access or raw SQL.
 */

import { z } from "zod/v4";
import { getProjectSummary } from "@/lib/services/project.service";
import {
  getEndpointsByProjectId,
  createEndpointRecord,
} from "@/lib/services/endpoint.service";
import {
  getRoutesByProjectId,
  findRouteById,
  createRouteRecord,
  updateRouteRecord,
  deleteRouteRecord,
} from "@/lib/services/route.service";
import {
  convertPropertiesToJsonSchema,
  validateResponseSchema,
} from "@/lib/services/schema.service";
import {
  computeCanvasLayout,
  persistCanvasState,
} from "@/lib/services/canvas.service";
import {
  generatedPropertySchema,
  generatedRouteSchema,
  validateAndNormalizeApi,
} from "./ai-validator.service";
import type { GeneratedProperty, GeneratedRoute } from "@/lib/types/ai.type";

// ─── Tool Definitions ─────────────────────────────────────────────────────────

export const agentTools = {
  /**
   * Tool 1: getProject — Retrieve project metadata and structure
   */
  getProject: {
    description:
      "Retrieves metadata and a structural summary for a project by its ID.",
    parameters: z.object({
      projectId: z.string().describe("The unique ID of the project"),
    }),
    execute: async (args: { projectId: string }) => {
      const summary = await getProjectSummary(args.projectId);
      if (!summary) {
        return {
          success: false,
          error: `Project not found with ID: ${args.projectId}`,
        };
      }
      return { success: true, project: summary };
    },
  },

  /**
   * Tool 2: getEndpoints — Retrieve endpoints for a project
   */
  getEndpoints: {
    description:
      "Retrieves all endpoints and their attached routes for a project.",
    parameters: z.object({
      projectId: z.string().describe("The unique ID of the project"),
    }),
    execute: async (args: { projectId: string }) => {
      const endpoints = await getEndpointsByProjectId(args.projectId);
      return { success: true, endpoints };
    },
  },

  /**
   * Tool 3: getRoutes — Retrieve all routes for a project
   */
  getRoutes: {
    description: "Retrieves all routes scoped to a specific project.",
    parameters: z.object({
      projectId: z.string().describe("The unique ID of the project"),
    }),
    execute: async (args: { projectId: string }) => {
      const routes = await getRoutesByProjectId(args.projectId);
      return { success: true, routes };
    },
  },

  /**
   * Tool 4: getRoute — Retrieve a specific route by ID
   */
  getRoute: {
    description:
      "Retrieves detailed information for a single route by its unique ID.",
    parameters: z.object({
      routeId: z.string().describe("The unique ID of the route"),
    }),
    execute: async (args: { routeId: string }) => {
      const route = await findRouteById(args.routeId);
      if (!route) {
        return {
          success: false,
          error: `Route not found with ID: ${args.routeId}`,
        };
      }
      return { success: true, route };
    },
  },

  /**
   * Tool 5: createEndpoint — Create endpoint definition
   */
  createEndpoint: {
    description: "Creates a new endpoint group in the project.",
    parameters: z.object({
      projectId: z
        .string()
        .describe("The project ID to create this endpoint under"),
      name: z
        .string()
        .describe("The display name of the endpoint (e.g. Products)"),
      description: z
        .string()
        .optional()
        .describe("Description of what this endpoint does"),
      basePath: z
        .string()
        .optional()
        .describe("The base path prefix (e.g. /products)"),
    }),
    execute: async (args: {
      projectId: string;
      name: string;
      description?: string;
      basePath?: string;
    }) => {
      const endpoint = await createEndpointRecord({
        projectId: args.projectId,
        name: args.name,
        description: args.description,
        basePath: args.basePath,
      });
      return { success: true, endpoint };
    },
  },

  /**
   * Tool 6: createRoute — Create a new route
   */
  createRoute: {
    description: "Creates a new HTTP mock route inside an endpoint.",
    parameters: z.object({
      endpointId: z.string().describe("The ID of the parent endpoint"),
      method: z
        .enum(["GET", "POST", "PUT", "DELETE", "PATCH"])
        .describe("HTTP Method"),
      path: z.string().describe("Route sub-path (e.g. /:id or empty string)"),
      statusCode: z.number().int().min(100).max(599).default(200),
      responseSchema: z
        .string()
        .optional()
        .describe("Stringified JSON Schema for response"),
      latencyMin: z.number().int().min(0).default(0),
      latencyMax: z.number().int().min(0).default(0),
      errorRate: z.number().min(0).max(100).default(0),
      customHeaders: z.string().optional(),
    }),
    execute: async (args: {
      endpointId: string;
      method: "GET" | "POST" | "PUT" | "DELETE" | "PATCH";
      path: string;
      statusCode: number;
      responseSchema?: string;
      latencyMin?: number;
      latencyMax?: number;
      errorRate?: number;
      customHeaders?: string;
    }) => {
      const route = await createRouteRecord({
        endpointId: args.endpointId,
        method: args.method,
        path: args.path,
        statusCode: args.statusCode,
        responseSchema: args.responseSchema,
        latencyMin: args.latencyMin,
        latencyMax: args.latencyMax,
        errorRate: args.errorRate,
        customHeaders: args.customHeaders,
      });
      return { success: true, route };
    },
  },

  /**
   * Tool 7: updateRoute — Modify an existing route
   */
  updateRoute: {
    description:
      "Updates configuration, schema, latency, or status code of an existing route.",
    parameters: z.object({
      id: z.string().describe("The unique ID of the route to update"),
      method: z.enum(["GET", "POST", "PUT", "DELETE", "PATCH"]).optional(),
      path: z.string().optional(),
      statusCode: z.number().int().min(100).max(599).optional(),
      responseSchema: z.string().optional(),
      latencyMin: z.number().int().min(0).optional(),
      latencyMax: z.number().int().min(0).optional(),
      errorRate: z.number().min(0).max(100).optional(),
      customHeaders: z.string().optional(),
    }),
    execute: async (args: {
      id: string;
      method?: "GET" | "POST" | "PUT" | "DELETE" | "PATCH";
      path?: string;
      statusCode?: number;
      responseSchema?: string;
      latencyMin?: number;
      latencyMax?: number;
      errorRate?: number;
      customHeaders?: string;
    }) => {
      const route = await updateRouteRecord(args);
      return { success: true, route };
    },
  },

  /**
   * Tool 8: deleteRoute — Delete a route
   */
  deleteRoute: {
    description: "Deletes a route by its ID.",
    parameters: z.object({
      routeId: z.string().describe("The unique ID of the route to delete"),
    }),
    execute: async (args: { routeId: string }) => {
      await deleteRouteRecord(args.routeId);
      return { success: true, deletedRouteId: args.routeId };
    },
  },

  /**
   * Tool 9: validateRoute — Validate route parameters and conventions
   */
  validateRoute: {
    description:
      "Validates route properties, REST path format, status code, and latency.",
    parameters: generatedRouteSchema,
    execute: async (route: GeneratedRoute) => {
      const result = validateAndNormalizeApi({
        name: "Validation API",
        endpoints: [
          {
            name: "Temp",
            basePath: "/temp",
            routes: [route],
          },
        ],
      });

      return {
        success: result.isValid,
        errors: result.errors,
        normalizedRoute: result.normalizedApi?.endpoints[0]?.routes[0],
      };
    },
  },

  /**
   * Tool 10: generateSchema — Generate Faker-backed response schema
   */
  generateSchema: {
    description:
      "Converts an array of property descriptors into a Faker-backed JSON Schema.",
    parameters: z.object({
      properties: z.array(generatedPropertySchema),
    }),
    execute: async (args: { properties: GeneratedProperty[] }) => {
      const schemaDoc = convertPropertiesToJsonSchema(args.properties);
      const schemaJson = JSON.stringify(schemaDoc, null, 2);
      const isValid = validateResponseSchema(schemaJson);

      return {
        success: isValid,
        schema: schemaDoc,
        schemaJson,
      };
    },
  },

  /**
   * Tool 11: updateCanvas — Recompute and save React Flow canvas layout
   */
  updateCanvas: {
    description:
      "Reconciles and synchronizes the React Flow visual canvas positions.",
    parameters: z.object({
      projectId: z.string().describe("The project ID"),
    }),
    execute: async (args: { projectId: string }) => {
      const endpoints = await getEndpointsByProjectId(args.projectId);
      const layout = computeCanvasLayout(endpoints);
      const saved = await persistCanvasState(args.projectId, layout);

      return {
        success: true,
        canvasStateId: saved.id,
        nodeCount: layout.nodes.length,
      };
    },
  },
};
