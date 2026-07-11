import { z } from "zod/v4";

// ─── HTTP Method ─────────────────────────────────────────────────────────────
export const httpMethods = ["GET", "POST", "PUT", "DELETE", "PATCH"] as const;
export type HttpMethod = (typeof httpMethods)[number];

export const httpMethodSchema = z.enum(httpMethods);

// ─── Project ─────────────────────────────────────────────────────────────────
export const createProjectSchema = z.object({
  name: z
    .string()
    .min(1, "Project name is required")
    .max(100, "Project name must be 100 characters or fewer"),
  slug: z
    .string()
    .max(100)
    .regex(
      /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
      "Slug must be lowercase alphanumeric with hyphens"
    )
    .optional(),
  description: z
    .string()
    .max(500, "Description must be 500 characters or fewer")
    .optional(),
});

export const updateProjectSchema = z.object({
  id: z.string().min(1),
  name: z
    .string()
    .min(1, "Project name is required")
    .max(100, "Project name must be 100 characters or fewer")
    .optional(),
  slug: z
    .string()
    .min(1, "Slug is required")
    .max(100)
    .regex(
      /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
      "Slug must be lowercase alphanumeric with hyphens"
    )
    .optional(),
  description: z
    .string()
    .max(500, "Description must be 500 characters or fewer")
    .optional(),
  isLoggingEnabled: z.boolean().optional(),
});

// ─── Endpoint ────────────────────────────────────────────────────────────────
export const createEndpointSchema = z.object({
  projectId: z.string().min(1),
  name: z
    .string()
    .min(1, "Endpoint name is required")
    .max(100, "Endpoint name must be 100 characters or fewer"),
  description: z
    .string()
    .max(500, "Description must be 500 characters or fewer")
    .optional(),
  basePath: z
    .string()
    .max(200)
    .optional(),
});

export const updateEndpointSchema = z.object({
  id: z.string().min(1),
  name: z
    .string()
    .min(1)
    .max(100)
    .optional(),
  description: z.string().max(500).optional(),
  basePath: z.string().max(200).optional(),
});

// ─── Route ───────────────────────────────────────────────────────────────────
export const createRouteSchema = z.object({
  endpointId: z.string().min(1),
  method: httpMethodSchema,
  path: z
    .string()
    .min(1, "Route path is required")
    .max(500, "Route path must be 500 characters or fewer"),
  statusCode: z.number().int().min(100).max(599).default(200),
  responseSchema: z.string().optional(),
});

export const updateRouteSchema = z.object({
  id: z.string().min(1),
  method: httpMethodSchema.optional(),
  path: z.string().min(1).max(500).optional(),
  statusCode: z.number().int().min(100).max(599).optional(),
  responseSchema: z.string().optional(),
  latencyMin: z.number().int().min(0).max(30000).optional(),
  latencyMax: z.number().int().min(0).max(30000).optional(),
  errorRate: z.number().min(0).max(100).optional(),
  customHeaders: z.string().optional(),
  conditionalRules: z.string().optional(),
  isEnabled: z.boolean().optional(),
});

// ─── Canvas State ────────────────────────────────────────────────────────────
export const saveCanvasStateSchema = z.object({
  projectId: z.string().min(1),
  nodes: z.string(),
  edges: z.string(),
  viewport: z.string(),
});

// ─── Type Exports ────────────────────────────────────────────────────────────
export type CreateProjectInput = z.infer<typeof createProjectSchema>;
export type UpdateProjectInput = z.infer<typeof updateProjectSchema>;
export type CreateEndpointInput = z.infer<typeof createEndpointSchema>;
export type UpdateEndpointInput = z.infer<typeof updateEndpointSchema>;
export type CreateRouteInput = z.infer<typeof createRouteSchema>;
export type UpdateRouteInput = z.infer<typeof updateRouteSchema>;
export type SaveCanvasStateInput = z.infer<typeof saveCanvasStateSchema>;
