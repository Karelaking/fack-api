import { sqliteTable, text, integer, real } from "drizzle-orm/sqlite-core";
import { relations } from "drizzle-orm";

// ─── Projects ────────────────────────────────────────────────────────────────
export const projects = sqliteTable("projects", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  description: text("description").default(""),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date()),
  updatedAt: integer("updated_at", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date()),
});

export const projectsRelations = relations(projects, ({ many, one }) => ({
  endpoints: many(endpoints),
  canvasState: one(canvasStates, {
    fields: [projects.id],
    references: [canvasStates.projectId],
  }),
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
  latencyMin: integer("latency_min").default(0),
  latencyMax: integer("latency_max").default(0),
  errorRate: real("error_rate").default(0),
  customHeaders: text("custom_headers").default("{}"),
  conditionalRules: text("conditional_rules").default("[]"),
  isEnabled: integer("is_enabled", { mode: "boolean" }).notNull().default(true),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date()),
  updatedAt: integer("updated_at", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date()),
});

export const routesRelations = relations(routes, ({ one }) => ({
  endpoint: one(endpoints, {
    fields: [routes.endpointId],
    references: [endpoints.id],
  }),
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

// ─── Type Exports ────────────────────────────────────────────────────────────
export type Project = typeof projects.$inferSelect;
export type NewProject = typeof projects.$inferInsert;
export type Endpoint = typeof endpoints.$inferSelect;
export type NewEndpoint = typeof endpoints.$inferInsert;
export type Route = typeof routes.$inferSelect;
export type NewRoute = typeof routes.$inferInsert;
export type CanvasState = typeof canvasStates.$inferSelect;
export type NewCanvasState = typeof canvasStates.$inferInsert;

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
