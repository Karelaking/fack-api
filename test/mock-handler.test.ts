/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { processMockRequest } from "../lib/mock-handler-core";
import { setCachedRoutes, clearCache } from "../lib/cache";
import type { Route, Project } from "@/db/schema";
import type { NextRequest } from "next/server";

// Mock the database and next/server to run completely offline
vi.mock("@/db", () => ({
  db: {
    query: {
      endpoints: {
        findMany: vi.fn(),
      },
    },
  },
}));

vi.mock("@/db/postgres", () => ({
  sqlClient: null,
}));

vi.mock("next/server", () => ({
  after: (cb: () => void) => {
    cb();
  },
}));

describe("Mock Handler Core - Edge Cases and Scenarios", () => {
  const mockProject: Project = {
    id: "project-1",
    name: "Test Project",
    slug: "test-project",
    userId: "user-1",
    description: "",
    isLoggingEnabled: false,
    isCachingEnabled: false,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const defaultRoute: Route = {
    id: "route-1",
    endpointId: "endpoint-1",
    method: "GET",
    path: "/api/v2/users",
    isEnabled: true,
    responseSchema: JSON.stringify({
      type: "object",
      properties: {
        id: { type: "string", "x-faker": "string.uuid" },
        name: { type: "string", "x-faker": "person.fullName" },
        email: { type: "string", "x-faker": "internet.email" },
        age: { type: "integer", minimum: 18, maximum: 60 },
      },
      required: ["id", "name", "email", "age"],
    }),
    errorRate: 0,
    statusCode: 200,
    latencyMin: 0,
    latencyMax: 0,
    conditionalRules: null,
    customHeaders: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(() => {
    clearCache();
  });

  // 1. Missing Route (404)
  it("should return 404 when route does not match path or method", async () => {
    setCachedRoutes(mockProject.id, [defaultRoute]);

    const request = {
      method: "POST", // Method mismatch
      headers: new Headers(),
      nextUrl: new URL("http://localhost:3000/api/v2/users"),
    } as unknown as NextRequest;

    const response = await processMockRequest({
      project: mockProject,
      requestPath: "/api/v2/users",
      request,
      startTime: Date.now(),
    });

    expect(response.status).toBe(404);
    const body = await response.json();
    expect(body.error).toBe(true);
    expect(body.message).toContain("not found");
  });

  it("should return 404 when route is disabled", async () => {
    const disabledRoute = { ...defaultRoute, isEnabled: false };
    setCachedRoutes(mockProject.id, [disabledRoute]);

    const request = {
      method: "GET",
      headers: new Headers(),
      nextUrl: new URL("http://localhost:3000/api/v2/users"),
    } as unknown as NextRequest;

    const response = await processMockRequest({
      project: mockProject,
      requestPath: "/api/v2/users",
      request,
      startTime: Date.now(),
    });

    expect(response.status).toBe(404);
  });

  // 2. Invalid Schema Handling
  it("should fallback gracefully to an empty object when responseSchema is invalid JSON", async () => {
    const invalidRoute = {
      ...defaultRoute,
      responseSchema: "{ invalid json",
    };
    setCachedRoutes(mockProject.id, [invalidRoute]);

    const request = {
      method: "GET",
      headers: new Headers(),
      nextUrl: new URL("http://localhost:3000/api/v2/users"),
    } as unknown as NextRequest;

    const response = await processMockRequest({
      project: mockProject,
      requestPath: "/api/v2/users",
      request,
      startTime: Date.now(),
    });

    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body).toHaveProperty("data");
    expect(body.data).toBeNull();
  });

  // 3. Simulated Error (Chaos Monkey)
  it("should return simulated error response when error rate is 100", async () => {
    const chaosRoute = {
      ...defaultRoute,
      errorRate: 100,
      statusCode: 503,
    };
    setCachedRoutes(mockProject.id, [chaosRoute]);

    const request = {
      method: "GET",
      headers: new Headers(),
      nextUrl: new URL("http://localhost:3000/api/v2/users"),
    } as unknown as NextRequest;

    const response = await processMockRequest({
      project: mockProject,
      requestPath: "/api/v2/users",
      request,
      startTime: Date.now(),
    });

    expect(response.status).toBe(503);
    const body = await response.json();
    expect(body.error).toBe(true);
    expect(body.message).toContain("Chaos Monkey");
  });

  // 4. Custom Headers
  it("should return custom headers in response headers", async () => {
    const customHeaderRoute = {
      ...defaultRoute,
      customHeaders: JSON.stringify({
        "X-Test-Header": "foo-bar",
        "Cache-Control": "public, max-age=3600",
      }),
    };
    setCachedRoutes(mockProject.id, [customHeaderRoute]);

    const request = {
      method: "GET",
      headers: new Headers(),
      nextUrl: new URL("http://localhost:3000/api/v2/users"),
    } as unknown as NextRequest;

    const response = await processMockRequest({
      project: mockProject,
      requestPath: "/api/v2/users",
      request,
      startTime: Date.now(),
    });

    expect(response.headers.get("X-Test-Header")).toBe("foo-bar");
    expect(response.headers.get("Cache-Control")).toBe("public, max-age=3600");
  });

  // 5. Conditional Rules
  it("should evaluate query conditional rules successfully", async () => {
    const ruleRoute = {
      ...defaultRoute,
      conditionalRules: JSON.stringify([
        {
          id: "rule-1",
          type: "query",
          key: "trigger",
          operator: "equals",
          value: "yes",
          responseStatus: 201,
          responseBody: JSON.stringify({ success: "triggered" }),
        },
      ]),
    };
    setCachedRoutes(mockProject.id, [ruleRoute]);

    const request = {
      method: "GET",
      headers: new Headers(),
      nextUrl: new URL("http://localhost:3000/api/v2/users?trigger=yes"),
    } as unknown as NextRequest;

    const response = await processMockRequest({
      project: mockProject,
      requestPath: "/api/v2/users",
      request,
      startTime: Date.now(),
    });

    expect(response.status).toBe(201);
    const body = await response.json();
    expect(body).toEqual({ success: "triggered" });
  });

  it("should evaluate header conditional rules successfully", async () => {
    const ruleRoute = {
      ...defaultRoute,
      conditionalRules: JSON.stringify([
        {
          id: "rule-2",
          type: "header",
          key: "x-api-key",
          operator: "exists",
          responseStatus: 403,
          responseBody: JSON.stringify({ error: "forbidden" }),
        },
      ]),
    };
    setCachedRoutes(mockProject.id, [ruleRoute]);

    const request = {
      method: "GET",
      headers: new Headers({ "x-api-key": "some-key" }),
      nextUrl: new URL("http://localhost:3000/api/v2/users"),
    } as unknown as NextRequest;

    const response = await processMockRequest({
      project: mockProject,
      requestPath: "/api/v2/users",
      request,
      startTime: Date.now(),
    });

    expect(response.status).toBe(403);
    const body = await response.json();
    expect(body).toEqual({ error: "forbidden" });
  });

  // 6. Pagination Edge Cases (Invalid Query Params)
  it("should handle non-numeric page/limit parameters gracefully by falling back to default values", async () => {
    setCachedRoutes(mockProject.id, [defaultRoute]);

    const request = {
      method: "GET",
      headers: new Headers(),
      nextUrl: new URL("http://localhost:3000/api/v2/users?page=abc&limit=xyz"),
    } as unknown as NextRequest;

    const response = await processMockRequest({
      project: mockProject,
      requestPath: "/api/v2/users",
      request,
      startTime: Date.now(),
    });

    expect(response.status).toBe(200);
    const body = await response.json();
    // Because isPagedRequest is true (pageParam is not null), it should return paged output
    expect(body.meta).toHaveProperty("page", 1); // default fallback
    expect(body.meta).toHaveProperty("limit", 10); // default fallback
    expect(body.data).toHaveLength(10);
  });

  it("should handle zero or negative page/limit values by falling back to default values", async () => {
    setCachedRoutes(mockProject.id, [defaultRoute]);

    const request = {
      method: "GET",
      headers: new Headers(),
      nextUrl: new URL("http://localhost:3000/api/v2/users?page=-5&limit=0"),
    } as unknown as NextRequest;

    const response = await processMockRequest({
      project: mockProject,
      requestPath: "/api/v2/users",
      request,
      startTime: Date.now(),
    });

    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.meta).toHaveProperty("page", 1);
    expect(body.meta).toHaveProperty("limit", 10);
  });

  // 7. Filtering and Searching Query Params
  it("should filter the generated response list based on field query parameters", async () => {
    const customArrayRoute = {
      ...defaultRoute,
      responseSchema: JSON.stringify({
        type: "array",
        items: {
          type: "object",
          properties: {
            gender: { type: "string", enum: ["male", "female"] },
          },
        },
      }),
    };
    setCachedRoutes(mockProject.id, [customArrayRoute]);

    // Let's request count=20, filtered by gender=female
    const request = {
      method: "GET",
      headers: new Headers(),
      nextUrl: new URL(
        "http://localhost:3000/api/v2/users?count=20&gender=female",
      ),
    } as unknown as NextRequest;

    const response = await processMockRequest({
      project: mockProject,
      requestPath: "/api/v2/users",
      request,
      startTime: Date.now(),
    });

    const body = await response.json();
    expect(Array.isArray(body.data)).toBe(true);
    // All items returned should have gender = "female"
    body.data.forEach((item: any) => {
      expect(item.gender).toBe("female");
    });
  });

  it("should filter the generated response list using global query search parameter 'q'", async () => {
    const customArrayRoute = {
      ...defaultRoute,
      responseSchema: JSON.stringify({
        type: "array",
        items: {
          type: "object",
          properties: {
            description: { type: "string", enum: ["needle", "haystack"] },
          },
        },
      }),
    };
    setCachedRoutes(mockProject.id, [customArrayRoute]);

    const request = {
      method: "GET",
      headers: new Headers(),
      nextUrl: new URL("http://localhost:3000/api/v2/users?count=20&q=needle"),
    } as unknown as NextRequest;

    const response = await processMockRequest({
      project: mockProject,
      requestPath: "/api/v2/users",
      request,
      startTime: Date.now(),
    });

    const body = await response.json();
    body.data.forEach((item: any) => {
      expect(item.description).toBe("needle");
    });
  });

  // 8. Sorting Query Params
  it("should sort the response list in ascending/descending order", async () => {
    const sortingRoute = {
      ...defaultRoute,
      responseSchema: JSON.stringify({
        type: "array",
        items: {
          type: "object",
          properties: {
            rank: { type: "integer", minimum: 1, maximum: 100 },
          },
        },
      }),
    };
    setCachedRoutes(mockProject.id, [sortingRoute]);

    // Request with count=10, sorted by rank descending
    const request = {
      method: "GET",
      headers: new Headers(),
      nextUrl: new URL(
        "http://localhost:3000/api/v2/users?count=10&sort=rank&order=desc",
      ),
    } as unknown as NextRequest;

    const response = await processMockRequest({
      project: mockProject,
      requestPath: "/api/v2/users",
      request,
      startTime: Date.now(),
    });

    const body = await response.json();
    expect(body.data).toHaveLength(10);
    // Verify it is sorted in descending order
    for (let i = 0; i < body.data.length - 1; i++) {
      expect(body.data[i].rank).toBeGreaterThanOrEqual(body.data[i + 1].rank);
    }
  });

  // 9. Root Array Schema
  it("should generate array response when root schema type is array", async () => {
    const arrayRoute = {
      ...defaultRoute,
      responseSchema: JSON.stringify({
        type: "array",
        items: {
          type: "object",
          properties: {
            id: { type: "string" },
          },
        },
      }),
    };
    setCachedRoutes(mockProject.id, [arrayRoute]);

    const request = {
      method: "GET",
      headers: new Headers(),
      nextUrl: new URL("http://localhost:3000/api/v2/users"), // No pagination parameters
    } as unknown as NextRequest;

    const response = await processMockRequest({
      project: mockProject,
      requestPath: "/api/v2/users",
      request,
      startTime: Date.now(),
    });

    const body = await response.json();
    expect(Array.isArray(body.data)).toBe(true);
    expect(body.data).toHaveLength(10); // default effectiveLimit is 10
  });

  // 10. Single Route & List Route Format verification
  it("should return a single object formatted response for a single route (no query params)", async () => {
    setCachedRoutes(mockProject.id, [defaultRoute]);

    const request = {
      method: "GET",
      headers: new Headers(),
      nextUrl: new URL("http://localhost:3000/api/v2/users"),
    } as unknown as NextRequest;

    const response = await processMockRequest({
      project: mockProject,
      requestPath: "/api/v2/users",
      request,
      startTime: Date.now(),
    });

    expect(response.status).toBe(200);
    const body = await response.json();

    expect(body).toHaveProperty("data");
    expect(body).toHaveProperty("meta");
    expect(body.data).toBeTypeOf("object");
    expect(body.data).not.toBeNull();
    expect(body.data).toHaveProperty("id");
    expect(body.data).toHaveProperty("name");
    expect(body.data).toHaveProperty("email");
    expect(body.meta).toHaveProperty("routeId", "route-1");
  });

  it("should return a list of objects formatted response when count parameter is specified", async () => {
    setCachedRoutes(mockProject.id, [defaultRoute]);

    const request = {
      method: "GET",
      headers: new Headers(),
      nextUrl: new URL("http://localhost:3000/api/v2/users?count=5"),
    } as unknown as NextRequest;

    const response = await processMockRequest({
      project: mockProject,
      requestPath: "/api/v2/users",
      request,
      startTime: Date.now(),
    });

    expect(response.status).toBe(200);
    const body = await response.json();

    expect(body).toHaveProperty("data");
    expect(body).toHaveProperty("meta");
    expect(Array.isArray(body.data)).toBe(true);
    expect(body.data).toHaveLength(5);
    expect(body.meta).toHaveProperty("count", 5);
  });

  it("should return paged output formatted response when page and limit parameters are specified", async () => {
    setCachedRoutes(mockProject.id, [defaultRoute]);

    const request = {
      method: "GET",
      headers: new Headers(),
      nextUrl: new URL("http://localhost:3000/api/v2/users?page=2&limit=4"),
    } as unknown as NextRequest;

    const response = await processMockRequest({
      project: mockProject,
      requestPath: "/api/v2/users",
      request,
      startTime: Date.now(),
    });

    expect(response.status).toBe(200);
    const body = await response.json();

    expect(body).toHaveProperty("data");
    expect(body).toHaveProperty("meta");
    expect(Array.isArray(body.data)).toBe(true);
    expect(body.data).toHaveLength(4);
    expect(body.meta).toHaveProperty("page", 2);
    expect(body.meta).toHaveProperty("limit", 4);
    expect(body.meta).toHaveProperty("total");
    expect(body.meta).toHaveProperty("totalPages");
    expect(body.meta).toHaveProperty("hasNextPage");
    expect(body.meta).toHaveProperty("hasPreviousPage", true);
  });
});
