import { describe, it, expect } from "vite-plus/test";
import {
  generatedApiSchema,
  validateAndNormalizeApi,
  normalizePath,
  normalizeErrorRate,
  detectRouteConflicts,
  buildApiChangeSet,
} from "../lib/ai/validator.service";
import type { GeneratedApi } from "../lib/ai/types";
import type { RouteWithEndpoint } from "../lib/services/route.service";
import type { EndpointWithRoutes } from "../lib/services/endpoint.service";

describe("AI API Architect — Validator & Conflict Detection", () => {
  describe("normalizePath", () => {
    it("should prepend leading slash and strip trailing slash", () => {
      expect(normalizePath("users")).toBe("/users");
      expect(normalizePath("users/")).toBe("/users");
      expect(normalizePath("/users/:id/")).toBe("/users/:id");
      expect(normalizePath("//users///posts//")).toBe("/users/posts");
      expect(normalizePath("")).toBe("/");
    });
  });

  describe("normalizeErrorRate", () => {
    it("should normalize fractional 0-1 values to 0-100 percentage", () => {
      expect(normalizeErrorRate(0.05)).toBe(5);
      expect(normalizeErrorRate(0.5)).toBe(50);
      expect(normalizeErrorRate(1)).toBe(100);
      expect(normalizeErrorRate(0)).toBe(0);
      expect(normalizeErrorRate(15)).toBe(15);
      expect(normalizeErrorRate(120)).toBe(100);
    });
  });

  describe("Zod schema validation", () => {
    it("should validate a conforming GeneratedApi object", () => {
      const validApi: GeneratedApi = {
        name: "Books API",
        description: "Book catalog",
        endpoints: [
          {
            name: "Books",
            basePath: "/books",
            routes: [
              {
                method: "GET",
                path: "",
                statusCode: 200,
                properties: [
                  { name: "id", type: "string", fakerProvider: "string.uuid" },
                  {
                    name: "title",
                    type: "string",
                    fakerProvider: "commerce.productName",
                  },
                ],
                latency: { min: 20, max: 100 },
                errorRate: 0,
              },
            ],
          },
        ],
      };

      const result = generatedApiSchema.safeParse(validApi);
      expect(result.success).toBe(true);
    });

    it("should reject an API with an invalid HTTP method", () => {
      const invalidApi = {
        name: "Bad API",
        endpoints: [
          {
            name: "Items",
            basePath: "/items",
            routes: [
              {
                method: "INVALID_METHOD",
                path: "/items",
                statusCode: 200,
                properties: [],
                latency: { min: 0, max: 0 },
                errorRate: 0,
              },
            ],
          },
        ],
      };

      const result = generatedApiSchema.safeParse(invalidApi);
      expect(result.success).toBe(false);
    });
  });

  describe("validateAndNormalizeApi", () => {
    it("should catch duplicate routes within the same endpoint", () => {
      const apiWithDuplicates: GeneratedApi = {
        name: "Duplicate Test API",
        endpoints: [
          {
            name: "Users",
            basePath: "/users",
            routes: [
              {
                method: "GET",
                path: "",
                statusCode: 200,
                properties: [],
                latency: { min: 0, max: 0 },
                errorRate: 0,
              },
              {
                method: "GET",
                path: "",
                statusCode: 200,
                properties: [],
                latency: { min: 0, max: 0 },
                errorRate: 0,
              },
            ],
          },
        ],
      };

      const validation = validateAndNormalizeApi(apiWithDuplicates);
      expect(validation.isValid).toBe(false);
      expect(
        validation.errors.some((e) =>
          e.message.includes("Duplicate route signature"),
        ),
      ).toBe(true);
    });

    it("should correct invalid latency ranges where min > max", () => {
      const apiWithInvertedLatency: GeneratedApi = {
        name: "Latency Test API",
        endpoints: [
          {
            name: "Users",
            basePath: "/users",
            routes: [
              {
                method: "GET",
                path: "",
                statusCode: 200,
                properties: [],
                latency: { min: 300, max: 100 },
                errorRate: 0,
              },
            ],
          },
        ],
      };

      const validation = validateAndNormalizeApi(apiWithInvertedLatency);
      expect(validation.isValid).toBe(true);
      const route = validation.normalizedApi?.endpoints[0]?.routes[0];
      expect(route?.latency.max).toBeGreaterThanOrEqual(
        route?.latency.min ?? 0,
      );
    });
  });

  describe("detectRouteConflicts & buildApiChangeSet", () => {
    it("should detect conflicts between proposed and existing routes", () => {
      const proposedApi: GeneratedApi = {
        name: "Store API",
        endpoints: [
          {
            name: "Products",
            basePath: "/products",
            routes: [
              {
                method: "GET",
                path: "",
                statusCode: 200,
                properties: [],
                latency: { min: 50, max: 100 },
                errorRate: 0,
              },
            ],
          },
        ],
      };

      const mockExistingRoutes: RouteWithEndpoint[] = [
        {
          id: "existing-route-1",
          endpointId: "ep-1",
          method: "GET",
          path: "",
          statusCode: 200,
          responseSchema: "{}",
          responseTemplate: null,
          isAuthRequired: false,
          latencyMin: 0,
          latencyMax: 0,
          errorRate: 0,
          customHeaders: "{}",
          conditionalRules: "[]",
          isEnabled: true,
          createdAt: new Date(),
          updatedAt: new Date(),
          endpoint: {
            id: "ep-1",
            projectId: "proj-1",
            name: "Products",
            description: "",
            basePath: "/products",
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        },
      ];

      const conflicts = detectRouteConflicts(proposedApi, mockExistingRoutes);
      expect(conflicts.length).toBe(1);
      expect(conflicts[0].existingRouteId).toBe("existing-route-1");
      expect(conflicts[0].method).toBe("GET");
      expect(conflicts[0].path).toBe("/products");
    });

    it("should apply resolutions in buildApiChangeSet", () => {
      const proposedApi: GeneratedApi = {
        name: "Store API",
        endpoints: [
          {
            name: "Products",
            basePath: "/products",
            routes: [
              {
                method: "GET",
                path: "",
                statusCode: 200,
                properties: [{ name: "id", type: "string" }],
                latency: { min: 50, max: 100 },
                errorRate: 0,
              },
            ],
          },
        ],
      };

      const mockExistingEndpoints: EndpointWithRoutes[] = [
        {
          id: "ep-1",
          projectId: "proj-1",
          name: "Products",
          description: "",
          basePath: "/products",
          createdAt: new Date(),
          updatedAt: new Date(),
          routes: [],
        },
      ];

      const mockExistingRoutes: RouteWithEndpoint[] = [
        {
          id: "existing-route-1",
          endpointId: "ep-1",
          method: "GET",
          path: "",
          statusCode: 200,
          responseSchema: "{}",
          responseTemplate: null,
          isAuthRequired: false,
          latencyMin: 0,
          latencyMax: 0,
          errorRate: 0,
          customHeaders: "{}",
          conditionalRules: "[]",
          isEnabled: true,
          createdAt: new Date(),
          updatedAt: new Date(),
          endpoint: mockExistingEndpoints[0],
        },
      ];

      // Test "replace" resolution
      const changeSetReplace = buildApiChangeSet(
        proposedApi,
        mockExistingEndpoints,
        mockExistingRoutes,
        { "GET:/products": "replace" },
      );
      expect(changeSetReplace.routesToUpdate.length).toBe(1);
      expect(changeSetReplace.routesToCreate.length).toBe(0);

      // Test "modify" resolution (generates /v2)
      const changeSetModify = buildApiChangeSet(
        proposedApi,
        mockExistingEndpoints,
        mockExistingRoutes,
        { "GET:/products": "modify" },
      );
      expect(changeSetModify.routesToCreate.length).toBe(1);
      expect(changeSetModify.routesToCreate[0].route.path).toBe("/v2");
    });
  });
});
