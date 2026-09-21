import { describe, it, expect } from "vitest";
import { computeCanvasLayout } from "../lib/services/canvas.service";
import { generateApiSpecification } from "../lib/ai/ai-architect.service";
import type { EndpointWithRoutes } from "../lib/services/endpoint.service";

describe("AI API Architect — Generation & Canvas Layout Coordination", () => {
  it("should generate a complete API specification matching an e-commerce requirement", async () => {
    const result = await generateApiSpecification({
      prompt:
        "Create an e-commerce API with products, cart, and checkout orders",
    });

    expect(result.success).toBe(true);
    expect(result.generation.endpoints.length).toBeGreaterThanOrEqual(1);

    const allRoutes = result.generation.endpoints.flatMap((ep) => ep.routes);
    expect(allRoutes.length).toBeGreaterThan(0);

    // Check REST conventions
    const hasGetRoute = allRoutes.some((r) => r.method === "GET");
    const hasPostRoute = allRoutes.some((r) => r.method === "POST");
    expect(hasGetRoute).toBe(true);
    expect(hasPostRoute).toBe(true);

    // Check ChangeSet summary
    expect(result.changeSet.summary.routesCount).toBe(allRoutes.length);
    expect(result.changeSet.summary.endpointsCount).toBe(
      result.generation.endpoints.length,
    );
  });

  it("should compute non-overlapping canvas layout for generated endpoints and routes", () => {
    const mockEndpoints: EndpointWithRoutes[] = [
      {
        id: "ep-1",
        projectId: "proj-1",
        name: "Users",
        description: "User endpoints",
        basePath: "/users",
        createdAt: new Date(),
        updatedAt: new Date(),
        routes: [
          {
            id: "route-1",
            endpointId: "ep-1",
            method: "GET",
            path: "",
            statusCode: 200,
            responseSchema: "{}",
            latencyMin: 0,
            latencyMax: 0,
            errorRate: 0,
            customHeaders: "{}",
            conditionalRules: "[]",
            isEnabled: true,
            createdAt: new Date(),
            updatedAt: new Date(),
          },
          {
            id: "route-2",
            endpointId: "ep-1",
            method: "POST",
            path: "",
            statusCode: 201,
            responseSchema: "{}",
            latencyMin: 0,
            latencyMax: 0,
            errorRate: 0,
            customHeaders: "{}",
            conditionalRules: "[]",
            isEnabled: true,
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        ],
      },
      {
        id: "ep-2",
        projectId: "proj-1",
        name: "Products",
        description: "Product catalog",
        basePath: "/products",
        createdAt: new Date(),
        updatedAt: new Date(),
        routes: [
          {
            id: "route-3",
            endpointId: "ep-2",
            method: "GET",
            path: "",
            statusCode: 200,
            responseSchema: "{}",
            latencyMin: 0,
            latencyMax: 0,
            errorRate: 0,
            customHeaders: "{}",
            conditionalRules: "[]",
            isEnabled: true,
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        ],
      },
    ];

    const layout = computeCanvasLayout(mockEndpoints);

    // Check that we have 2 group nodes and 3 route nodes
    const groupNodes = layout.nodes.filter((n) => n.type === "endpointGroup");
    const routeNodes = layout.nodes.filter((n) => n.type === "routeNode");

    expect(groupNodes.length).toBe(2);
    expect(routeNodes.length).toBe(3);

    // Ensure group 2 is horizontally offset from group 1
    expect(groupNodes[1].position.x).toBeGreaterThan(groupNodes[0].position.x);

    // Ensure child routes have appropriate parentId
    expect(routeNodes[0].parentId).toBe("group-ep-1");
    expect(routeNodes[1].parentId).toBe("group-ep-1");
    expect(routeNodes[2].parentId).toBe("group-ep-2");

    // Ensure sibling routes in same group are vertically offset
    expect(routeNodes[1].position.y).toBeGreaterThan(routeNodes[0].position.y);
  });
});
