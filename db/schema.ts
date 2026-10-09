import { sqliteTable, text, integer, real } from "drizzle-orm/sqlite-core";
import { relations } from "drizzle-orm";

// ─── Projects ────────────────────────────────────────────────────────────────
export const projects = sqliteTable("projects", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull().default("system"),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  description: text("description").default(""),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date()),
  updatedAt: integer("updated_at", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date()),
  isLoggingEnabled: integer("is_logging_enabled", { mode: "boolean" })
    .notNull()
    .default(true),
  isCachingEnabled: integer("is_caching_enabled", { mode: "boolean" })
    .notNull()
    .default(true),
  version: integer("version").notNull().default(1),
  activeScenarioId: text("active_scenario_id"),
});

export const projectsRelations = relations(projects, ({ many, one }) => ({
  endpoints: many(endpoints),
  canvasState: one(canvasStates, {
    fields: [projects.id],
    references: [canvasStates.projectId],
  }),
  generationTasks: many(generationTasks),
  generationProposals: many(generationProposals),
  revisions: many(projectRevisions),
}));

// ─── Endpoints ───────────────────────────────────────────────────────────────
export const endpoints = sqliteTable("endpoints", {
  id: text("id").primaryKey(),
  projectId: text("project_id")
    .notNull()
    .references(() => projects.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  description: text("description").default(""),
  basePath: text("base_path").notNull().default(""),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date()),
  updatedAt: integer("updated_at", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date()),
});

export const endpointsRelations = relations(endpoints, ({ one, many }) => ({
  project: one(projects, {
    fields: [endpoints.projectId],
    references: [projects.id],
  }),
  routes: many(routes),
}));

// ─── Routes ──────────────────────────────────────────────────────────────────
export const routes = sqliteTable("routes", {
  id: text("id").primaryKey(),
  endpointId: text("endpoint_id")
    .notNull()
    .references(() => endpoints.id, { onDelete: "cascade" }),
  method: text("method", {
    enum: ["GET", "POST", "PUT", "DELETE", "PATCH"],
  }).notNull(),
  path: text("path").notNull(),
  statusCode: integer("status_code").notNull().default(200),
  responseSchema: text("response_schema").default("{}"),
  responseTemplate: text("response_template"),
  latencyMin: integer("latency_min").default(0),
  latencyMax: integer("latency_max").default(0),
  errorRate: real("error_rate").default(0),
  customHeaders: text("custom_headers").default("{}"),
  conditionalRules: text("conditional_rules").default("[]"),
  isAuthRequired: integer("is_auth_required", { mode: "boolean" })
    .notNull()
    .default(false),
  isEnabled: integer("is_enabled", { mode: "boolean" }).notNull().default(true),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date()),
  updatedAt: integer("updated_at", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date()),
});

export const routesRelations = relations(routes, ({ one, many }) => ({
  endpoint: one(endpoints, {
    fields: [routes.endpointId],
    references: [endpoints.id],
  }),
  webhooks: many(webhooks),
}));

// ─── Canvas States ───────────────────────────────────────────────────────────
export const canvasStates = sqliteTable("canvas_states", {
  id: text("id").primaryKey(),
  projectId: text("project_id")
    .notNull()
    .unique()
    .references(() => projects.id, { onDelete: "cascade" }),
  nodes: text("nodes").notNull().default("[]"),
  edges: text("edges").notNull().default("[]"),
  viewport: text("viewport").notNull().default('{"x":0,"y":0,"zoom":1}'),
});

export const canvasStatesRelations = relations(canvasStates, ({ one }) => ({
  project: one(projects, {
    fields: [canvasStates.projectId],
    references: [projects.id],
  }),
}));

// ─── Project Revisions ────────────────────────────────────────────────────────
export const projectRevisions = sqliteTable("project_revisions", {
  id: text("id").primaryKey(),
  projectId: text("project_id")
    .notNull()
    .references(() => projects.id, { onDelete: "cascade" }),
  version: integer("version").notNull(),
  description: text("description").notNull(),
  snapshot: text("snapshot").notNull(), // OpenAPI or structured JSON of the state
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date()),
});

export const projectRevisionsRelations = relations(
  projectRevisions,
  ({ one }) => ({
    project: one(projects, {
      fields: [projectRevisions.projectId],
      references: [projects.id],
    }),
  }),
);

// ─── Generation Tasks ────────────────────────────────────────────────────────
export const generationTasks = sqliteTable("generation_tasks", {
  id: text("id").primaryKey(),
  projectId: text("project_id")
    .notNull()
    .references(() => projects.id, { onDelete: "cascade" }),
  prompt: text("prompt").notNull(),
  status: text("status", {
    enum: ["pending", "active", "completed", "failed"],
  })
    .notNull()
    .default("pending"),
  providerMetadata: text("provider_metadata"),
  error: text("error"),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date()),
  updatedAt: integer("updated_at", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date()),
});

export const generationTasksRelations = relations(
  generationTasks,
  ({ one, many }) => ({
    project: one(projects, {
      fields: [generationTasks.projectId],
      references: [projects.id],
    }),
    proposals: many(generationProposals),
  }),
);

// ─── Generation Proposals ────────────────────────────────────────────────────
export const generationProposals = sqliteTable("generation_proposals", {
  id: text("id").primaryKey(),
  taskId: text("task_id")
    .notNull()
    .references(() => generationTasks.id, { onDelete: "cascade" }),
  projectId: text("project_id")
    .notNull()
    .references(() => projects.id, { onDelete: "cascade" }),
  baseProjectVersion: integer("base_project_version").notNull(),
  payload: text("payload").notNull(),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date()),
});

export const generationProposalsRelations = relations(
  generationProposals,
  ({ one }) => ({
    task: one(generationTasks, {
      fields: [generationProposals.taskId],
      references: [generationTasks.id],
    }),
    project: one(projects, {
      fields: [generationProposals.projectId],
      references: [projects.id],
    }),
  }),
);

// ─── Mock State (Stateful Workflows) ─────────────────────────────────────────
export const mockStates = sqliteTable("mock_states", {
  id: text("id").primaryKey(),
  projectId: text("project_id")
    .notNull()
    .references(() => projects.id, { onDelete: "cascade" }),
  collection: text("collection").notNull(),
  itemKey: text("item_key").notNull(),
  data: text("data").notNull(), // JSON blob
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date()),
  updatedAt: integer("updated_at", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date()),
});

export const mockStatesRelations = relations(mockStates, ({ one }) => ({
  project: one(projects, {
    fields: [mockStates.projectId],
    references: [projects.id],
  }),
}));

// ─── Scenarios ───────────────────────────────────────────────────────────────
export const scenarios = sqliteTable("scenarios", {
  id: text("id").primaryKey(),
  projectId: text("project_id")
    .notNull()
    .references(() => projects.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  description: text("description").default(""),
  latencyMultiplier: real("latency_multiplier").notNull().default(1.0),
  forcedErrorRate: real("forced_error_rate").notNull().default(0), // 0 to 1
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date()),
  updatedAt: integer("updated_at", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date()),
});

export const scenariosRelations = relations(scenarios, ({ one }) => ({
  project: one(projects, {
    fields: [scenarios.projectId],
    references: [projects.id],
  }),
}));

// ─── Webhooks (Outbound Callbacks) ───────────────────────────────────────────
export const webhooks = sqliteTable("webhooks", {
  id: text("id").primaryKey(),
  routeId: text("route_id")
    .notNull()
    .references(() => routes.id, { onDelete: "cascade" }),
  url: text("url").notNull(),
  method: text("method", {
    enum: ["GET", "POST", "PUT", "DELETE", "PATCH"],
  })
    .notNull()
    .default("POST"),
  payloadTemplate: text("payload_template").default("{}"),
  delayMs: integer("delay_ms").notNull().default(0),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date()),
});

export const webhooksRelations = relations(webhooks, ({ one }) => ({
  route: one(routes, {
    fields: [webhooks.routeId],
    references: [routes.id],
  }),
}));

// ─── Type Exports ────────────────────────────────────────────────────────────
export type Project = typeof projects.$inferSelect;
export type NewProject = typeof projects.$inferInsert;
export type Endpoint = typeof endpoints.$inferSelect;
export type NewEndpoint = typeof endpoints.$inferInsert;
export type Route = typeof routes.$inferSelect;
export type NewRoute = typeof routes.$inferInsert;
export type CanvasState = typeof canvasStates.$inferSelect;
export type NewCanvasState = typeof canvasStates.$inferInsert;
export type GenerationTask = typeof generationTasks.$inferSelect;
export type NewGenerationTask = typeof generationTasks.$inferInsert;
export type GenerationProposal = typeof generationProposals.$inferSelect;
export type NewGenerationProposal = typeof generationProposals.$inferInsert;
export type ProjectRevision = typeof projectRevisions.$inferSelect;
export type NewProjectRevision = typeof projectRevisions.$inferInsert;
export type MockState = typeof mockStates.$inferSelect;
export type NewMockState = typeof mockStates.$inferInsert;
export type Scenario = typeof scenarios.$inferSelect;
export type NewScenario = typeof scenarios.$inferInsert;
export type Webhook = typeof webhooks.$inferSelect;
export type NewWebhook = typeof webhooks.$inferInsert;

export interface RequestLog {
  id: string;
  projectId: string;
  timestamp: number;
  method: string;
  path: string;
  queryParams: string | null;
  headers: string | null;
  statusCode: number;
  latency: number;
  isError: boolean;
  responsePayload: string | null;
}

export type NewRequestLog = Omit<RequestLog, "id"> & { id?: string };

export type HttpMethod = "GET" | "POST" | "PUT" | "DELETE" | "PATCH";
