import { describe, it, expect } from "vite-plus/test";
import {
  buildDraftPlan,
  draftSlug,
  EMPTY_DRAFT_PLAN,
} from "../components/canvas/preview-nodes";
import type {
  ApiChangeSet,
  GeneratedRoute,
  RouteConflict,
} from "../lib/ai/types";
import type { Endpoint, Route } from "../db/schema";

function generatedRoute(
  method: GeneratedRoute["method"],
  path: string,
): GeneratedRoute {
  return {
    method,
    path,
    statusCode: 200,
    properties: [],
    latency: { min: 0, max: 0 },
    errorRate: 0,
  };
}

function changeSet(overrides: Partial<ApiChangeSet> = {}): ApiChangeSet {
  return {
    endpointsToCreate: [],
    routesToCreate: [],
    routesToUpdate: [],
    routesToDelete: [],
    conflicts: [],
    summary: {
      endpointsCount: 0,
      routesCount: 0,
      fieldsCount: 0,
      conflictsCount: 0,
    },
    ...overrides,
  };
}

function existingEndpoint(
  id: string,
  name: string,
): Endpoint & { routes: Route[] } {
  return {
    id,
    name,
    basePath: `/${name.toLowerCase()}`,
  } as unknown as Endpoint & {
    routes: Route[];
  };
}

function conflict(overrides: Partial<RouteConflict> = {}): RouteConflict {
  return {
    endpointName: "Products",
    existingRouteId: "route-1",
    method: "GET",
    path: "/products",
    proposedRoute: generatedRoute("GET", "/products"),
    suggestedResolution: "replace",
    ...overrides,
  };
}

describe("draftSlug", () => {
  it("normalises names into id-safe fragments", () => {
    expect(draftSlug("Product Catalog")).toBe("product-catalog");
    expect(draftSlug("  ")).toBe("endpoint");
  });
});

describe("buildDraftPlan", () => {
  it("returns an empty plan when there is no change set", () => {
    expect(buildDraftPlan(null, [])).toEqual(EMPTY_DRAFT_PLAN);
  });

  it("creates one draft group and parents its routes to it", () => {
    const plan = buildDraftPlan(
      changeSet({
        endpointsToCreate: [
          { name: "Products", basePath: "/products", routes: [] },
        ],
        routesToCreate: [
          {
            endpointName: "Products",
            route: generatedRoute("GET", "/products"),
          },
          {
            endpointName: "Products",
            route: generatedRoute("POST", "/products"),
          },
        ],
      }),
      [],
    );

    expect(plan.groups).toHaveLength(1);
    expect(plan.groups[0].id).toBe("preview-group-products");
    expect(plan.routes.map((route) => route.parentId)).toEqual([
      "preview-group-products",
      "preview-group-products",
    ]);
    expect(plan.total).toBe(3);
  });

  it("reuses an existing group when the endpoint already exists", () => {
    const plan = buildDraftPlan(
      changeSet({
        endpointsToCreate: [
          { name: "Products", basePath: "/products", routes: [] },
        ],
        routesToCreate: [
          {
            endpointName: "Products",
            route: generatedRoute("GET", "/products"),
          },
        ],
      }),
      [existingEndpoint("ep-1", "Products")],
    );

    expect(plan.groups).toHaveLength(0);
    expect(plan.routes[0].parentId).toBe("group-ep-1");
    expect(plan.total).toBe(1);
  });

  it("honours an explicit endpointId when one is provided", () => {
    const plan = buildDraftPlan(
      changeSet({
        routesToCreate: [
          {
            endpointName: "Products",
            endpointId: "ep-9",
            route: generatedRoute("GET", "/products/9"),
          },
        ],
      }),
      [],
    );

    expect(plan.routes[0].parentId).toBe("group-ep-9");
  });

  it("synthesises a group for an endpoint the client has never seen", () => {
    const plan = buildDraftPlan(
      changeSet({
        routesToCreate: [
          { endpointName: "Orders", route: generatedRoute("GET", "/orders") },
        ],
      }),
      [],
    );

    expect(plan.groups.map((group) => group.id)).toEqual([
      "preview-group-orders",
    ]);
    expect(plan.routes[0].parentId).toBe("preview-group-orders");
  });

  it("marks existing routes that will change or disappear", () => {
    const plan = buildDraftPlan(
      changeSet({
        routesToUpdate: [
          {
            routeId: "route-1",
            existingMethod: "GET",
            existingPath: "/products",
            proposedRoute: generatedRoute("GET", "/products"),
          },
        ],
        routesToDelete: [
          { routeId: "route-2", method: "DELETE", path: "/products/2" },
        ],
      }),
      [existingEndpoint("ep-1", "Products")],
    );

    expect(plan.marks["route-1"].changeType).toBe("update");
    expect(plan.marks["route-2"].changeType).toBe("delete");
    expect(plan.total).toBe(2);
  });

  it("flags a created route that collides with an existing path", () => {
    const plan = buildDraftPlan(
      changeSet({
        routesToCreate: [
          {
            endpointName: "Products",
            route: generatedRoute("GET", "/products"),
          },
        ],
        conflicts: [conflict({ method: "GET", path: "/api/products" })],
      }),
      [],
    );

    expect(plan.routes[0].mark.hasConflict).toBe(true);
  });

  it("does not flag a created route using a different method", () => {
    const plan = buildDraftPlan(
      changeSet({
        routesToCreate: [
          {
            endpointName: "Products",
            route: generatedRoute("POST", "/products"),
          },
        ],
        conflicts: [conflict({ method: "GET", path: "/api/products" })],
      }),
      [],
    );

    expect(plan.routes[0].mark.hasConflict).toBe(false);
  });

  it("flags an update whose existing route id is in conflict", () => {
    const plan = buildDraftPlan(
      changeSet({
        routesToUpdate: [
          {
            routeId: "route-1",
            existingMethod: "GET",
            existingPath: "/products",
            proposedRoute: generatedRoute("GET", "/products"),
          },
        ],
        conflicts: [conflict({ existingRouteId: "route-1" })],
      }),
      [],
    );

    expect(plan.marks["route-1"].hasConflict).toBe(true);
  });
});
