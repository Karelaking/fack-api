import { describe, it, expect, beforeEach } from "vitest";
import {
  findMatchingRoute,
  clearMatcherCache,
  type RouteDefinition,
} from "../lib/route-matcher";

describe("Route Matcher", () => {
  beforeEach(() => {
    clearMatcherCache();
  });

  const routes: RouteDefinition[] = [
    {
      id: "1",
      endpointId: "end-1",
      method: "GET",
      path: "/users/me",
      statusCode: 200,
      isEnabled: true,
      createdAt: new Date(),
      updatedAt: new Date(),
      errorRate: 0,
      latencyMin: 0,
      latencyMax: 0,
      conditionalRules: null,
      customHeaders: null,
      responseSchema: "{}",
    },
    {
      id: "2",
      endpointId: "end-1",
      method: "GET",
      path: "/users/:id",
      statusCode: 200,
      isEnabled: true,
      createdAt: new Date(),
      updatedAt: new Date(),
      errorRate: 0,
      latencyMin: 0,
      latencyMax: 0,
      conditionalRules: null,
      customHeaders: null,
      responseSchema: "{}",
    },
    {
      id: "3",
      endpointId: "end-1",
      method: "POST",
      path: "/users",
      statusCode: 200,
      isEnabled: true,
      createdAt: new Date(),
      updatedAt: new Date(),
      errorRate: 0,
      latencyMin: 0,
      latencyMax: 0,
      conditionalRules: null,
      customHeaders: null,
      responseSchema: "{}",
    },
    {
      id: "4",
      endpointId: "end-1",
      method: "GET",
      path: "/users/:id/posts/:postId",
      statusCode: 200,
      isEnabled: true,
      createdAt: new Date(),
      updatedAt: new Date(),
      errorRate: 0,
      latencyMin: 0,
      latencyMax: 0,
      conditionalRules: null,
      customHeaders: null,
      responseSchema: "{}",
    },
  ];

  it("should match static routes first before dynamic routes", () => {
    const matchResult = findMatchingRoute(routes, "GET", "/users/me");
    expect(matchResult).not.toBeNull();
    expect(matchResult?.route.id).toBe("1");
    expect(matchResult?.params).toEqual({});
  });

  it("should match dynamic routes and extract route parameters", () => {
    const matchResult = findMatchingRoute(routes, "GET", "/users/12345");
    expect(matchResult).not.toBeNull();
    expect(matchResult?.route.id).toBe("2");
    expect(matchResult?.params).toEqual({ id: "12345" });
  });

  it("should match complex dynamic routes with multiple parameters", () => {
    const matchResult = findMatchingRoute(
      routes,
      "GET",
      "/users/alice/posts/post-99",
    );
    expect(matchResult).not.toBeNull();
    expect(matchResult?.route.id).toBe("4");
    expect(matchResult?.params).toEqual({ id: "alice", postId: "post-99" });
  });

  it("should perform case-insensitive HTTP method matching", () => {
    const matchResult = findMatchingRoute(routes, "get", "/users/me");
    expect(matchResult).not.toBeNull();
    expect(matchResult?.route.id).toBe("1");
  });

  it("should return null if method does not match", () => {
    const matchResult = findMatchingRoute(routes, "POST", "/users/me");
    expect(matchResult).toBeNull();
  });

  it("should return null if path does not match any route pattern", () => {
    const matchResult = findMatchingRoute(routes, "GET", "/non-existent-path");
    expect(matchResult).toBeNull();
  });

  it("should handle invalid path patterns gracefully without crashing", () => {
    const badRoutes: RouteDefinition[] = [
      {
        ...routes[0],
        path: "/invalid(/:param", // bad parenthesis regex grouping
      },
    ];
    const matchResult = findMatchingRoute(badRoutes, "GET", "/users/me");
    expect(matchResult).toBeNull();
  });

  it("should correctly prioritize routes based on complexity and dynamic parameters", () => {
    const mixedRoutes: RouteDefinition[] = [
      {
        ...routes[0],
        id: "a",
        path: "/api/v1/:resource/:id",
      },
      {
        ...routes[0],
        id: "b",
        path: "/api/v1/users/:id",
      },
      {
        ...routes[0],
        id: "c",
        path: "/api/v1/users/me",
      },
    ];

    // GET /api/v1/users/me matches "/api/v1/users/me" (static route wins over dynamic)
    const matchC = findMatchingRoute(mixedRoutes, "GET", "/api/v1/users/me");
    expect(matchC?.route.id).toBe("c");

    // GET /api/v1/users/123 matches "/api/v1/users/:id" (fewer dynamic parameters wins)
    const matchB = findMatchingRoute(mixedRoutes, "GET", "/api/v1/users/123");
    expect(matchB?.route.id).toBe("b");
    expect(matchB?.params).toEqual({ id: "123" });

    // GET /api/v1/posts/456 matches "/api/v1/:resource/:id"
    const matchA = findMatchingRoute(mixedRoutes, "GET", "/api/v1/posts/456");
    expect(matchA?.route.id).toBe("a");
    expect(matchA?.params).toEqual({ resource: "posts", id: "456" });
  });

  it("should match wildcard routes and parse parameters correctly", () => {
    const wildcardRoutes: RouteDefinition[] = [
      {
        ...routes[0],
        id: "wildcard",
        path: "/files/*path",
      },
    ];

    const matchResult = findMatchingRoute(
      wildcardRoutes,
      "GET",
      "/files/assets/images/logo.png",
    );
    expect(matchResult).not.toBeNull();
    expect(matchResult?.route.id).toBe("wildcard");
    expect(matchResult?.params).toEqual({
      path: ["assets", "images", "logo.png"],
    });
  });
});
