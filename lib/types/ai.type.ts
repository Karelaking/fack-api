/**
 * Fack AI API Architect — Type Definitions
 *
 * Defines core contracts for AI-generated APIs, intermediate representations,
 * change sets, conflict resolutions, and streaming progress steps.
 */

import type { HttpMethod } from "@/db/schema";

// ─── Schema & Property Types ──────────────────────────────────────────────────

export type JsonSchemaPropertyType =
  "string" | "number" | "integer" | "boolean" | "object" | "array";

export interface GeneratedProperty {
  name: string;
  type: JsonSchemaPropertyType;
  fakerProvider?: string;
  nullable?: boolean;
  children?: GeneratedProperty[];
  arrayItemType?: "string" | "number" | "integer" | "boolean" | "object";
  arrayItemFakerProvider?: string;
  arrayItemChildren?: GeneratedProperty[];
}

export interface GeneratedRoute {
  method: HttpMethod;
  path: string;
  statusCode: number;
  description?: string;
  properties: GeneratedProperty[];
  latency: {
    min: number;
    max: number;
  };
  errorRate: number;
  customHeaders?: Record<string, string>;
}

export interface GeneratedEndpoint {
  name: string;
  description?: string;
  basePath: string;
  routes: GeneratedRoute[];
}

export interface GeneratedApi {
  name: string;
  description?: string;
  endpoints: GeneratedEndpoint[];
}

// ─── Change Set Model ────────────────────────────────────────────────────────

export type ApiChange =
  | {
      type: "CREATE_ENDPOINT";
      endpoint: {
        name: string;
        description?: string;
        basePath: string;
      };
    }
  | {
      type: "CREATE_ROUTE";
      endpointName: string;
      endpointId?: string;
      route: {
        method: HttpMethod;
        path: string;
        statusCode: number;
        responseSchema: string;
        latencyMin: number;
        latencyMax: number;
        errorRate: number;
        customHeaders?: string;
      };
    }
  | {
      type: "UPDATE_ROUTE";
      routeId: string;
      changes: {
        method?: HttpMethod;
        path?: string;
        statusCode?: number;
        responseSchema?: string;
        latencyMin?: number;
        latencyMax?: number;
        errorRate?: number;
        customHeaders?: string;
      };
    }
  | {
      type: "DELETE_ROUTE";
      routeId: string;
    };

export interface RouteConflict {
  endpointName: string;
  existingRouteId: string;
  method: HttpMethod;
  path: string;
  proposedRoute: GeneratedRoute;
  suggestedResolution: "replace" | "skip" | "modify";
  resolvedResolution?: "replace" | "skip" | "modify";
}

export interface ApiChangeSet {
  endpointsToCreate: GeneratedEndpoint[];
  routesToCreate: Array<{
    endpointName: string;
    endpointId?: string;
    route: GeneratedRoute;
  }>;
  routesToUpdate: Array<{
    routeId: string;
    existingMethod: HttpMethod;
    existingPath: string;
    proposedRoute: GeneratedRoute;
  }>;
  routesToDelete: Array<{
    routeId: string;
    method: HttpMethod;
    path: string;
  }>;
  conflicts: RouteConflict[];
  summary: {
    endpointsCount: number;
    routesCount: number;
    fieldsCount: number;
    conflictsCount: number;
  };
}

// ─── Streaming Progress & Pipeline Contracts ────────────────────────────────

export interface DetailedPromptResult {
  detailedPrompt: string;
  summary: string;
  entities: string[];
}

export type GenerationProgressStatus =
  "pending" | "active" | "completed" | "failed";

export type GenerationProgressStepId =
  | "understanding"
  | "expanding_prompt"
  | "inspecting"
  | "designing"
  | "validating"
  | "checking_conflicts"
  | "complete";

export interface GenerationProgressStep {
  id: GenerationProgressStepId;
  label: string;
  status: GenerationProgressStatus;
  detail?: string;
}

// ─── API Request & Response Contracts ────────────────────────────────────────

export interface GenerateApiRequest {
  projectId?: string;
  prompt: string;
  stream?: boolean;
}

export interface GenerateApiResponse {
  success: boolean;
  generation?: GeneratedApi;
  changeSet?: ApiChangeSet;
  conflicts?: RouteConflict[];
  detailedPrompt?: string;
  detailedSummary?: string;
  error?: string;
  proposalId?: string;
  expectedVersion?: number;
}

export interface ApplyApiRequest {
  projectId: string;
  proposalId: string;
  expectedVersion: number;
  resolutions?: Record<string, "replace" | "skip" | "modify">;
}

export interface ApplyApiResponse {
  success: boolean;
  created: {
    endpoints: number;
    routes: number;
  };
  updated: number;
  deleted: number;
  error?: string;
}
