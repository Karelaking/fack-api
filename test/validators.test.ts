import { describe, it, expect } from "vitest";
import {
  createProjectSchema,
  updateProjectSchema,
  createEndpointSchema,
  updateEndpointSchema,
  createRouteSchema,
  updateRouteSchema,
  saveCanvasStateSchema,
} from "../lib/validators";

describe("Validators", () => {
  describe("createProjectSchema", () => {
    it("should accept valid inputs", () => {
      const valid = {
        name: "My App",
        slug: "my-app",
        description: "A cool app",
      };
      const result = createProjectSchema.safeParse(valid);
      expect(result.success).toBe(true);
    });

    it("should fail for empty names", () => {
      const invalid = { name: "" };
      const result = createProjectSchema.safeParse(invalid);
      expect(result.success).toBe(false);
    });

    it("should reject invalid slug characters", () => {
      const invalid = {
        name: "Test",
        slug: "Invalid Slug!",
      };
      const result = createProjectSchema.safeParse(invalid);
      expect(result.success).toBe(false);
    });
  });

  describe("updateProjectSchema", () => {
    it("should require ID", () => {
      const invalid = { name: "New Name" };
      const result = updateProjectSchema.safeParse(invalid);
      expect(result.success).toBe(false);
    });

    it("should accept partial updates", () => {
      const valid = { id: "proj-123", isLoggingEnabled: true };
      const result = updateProjectSchema.safeParse(valid);
      expect(result.success).toBe(true);
    });
  });

  describe("createEndpointSchema", () => {
    it("should validate all required fields", () => {
      const valid = {
        projectId: "proj-1",
        name: "Users Endpoint",
        basePath: "/users",
      };
      expect(createEndpointSchema.safeParse(valid).success).toBe(true);

      const missingProject = { name: "Users Endpoint" };
      expect(createEndpointSchema.safeParse(missingProject).success).toBe(
        false,
      );
    });
  });

  describe("updateEndpointSchema", () => {
    it("should require ID and support partial updates", () => {
      expect(updateEndpointSchema.safeParse({ id: "end-1" }).success).toBe(
        true,
      );
      expect(updateEndpointSchema.safeParse({ name: "Updated" }).success).toBe(
        false,
      );
    });
  });

  describe("createRouteSchema", () => {
    it("should accept HTTP GET method", () => {
      const valid = {
        endpointId: "end-123",
        method: "GET",
        path: "/users",
      };
      const result = createRouteSchema.safeParse(valid);
      expect(result.success).toBe(true);
    });

    it("should fail for unsupported HTTP method", () => {
      const invalid = {
        endpointId: "end-123",
        method: "HEAD", // not supported by httpMethodSchema
        path: "/users",
      };
      const result = createRouteSchema.safeParse(invalid);
      expect(result.success).toBe(false);
    });
  });

  describe("updateRouteSchema", () => {
    it("should enforce errorRate range 0-100", () => {
      const validLow = { id: "route-1", errorRate: 0 };
      const validHigh = { id: "route-1", errorRate: 100 };
      const invalidLow = { id: "route-1", errorRate: -1 };
      const invalidHigh = { id: "route-1", errorRate: 101 };

      expect(updateRouteSchema.safeParse(validLow).success).toBe(true);
      expect(updateRouteSchema.safeParse(validHigh).success).toBe(true);
      expect(updateRouteSchema.safeParse(invalidLow).success).toBe(false);
      expect(updateRouteSchema.safeParse(invalidHigh).success).toBe(false);
    });

    it("should enforce latency constraints", () => {
      const valid = { id: "route-1", latencyMin: 500, latencyMax: 1000 };
      const invalid = { id: "route-1", latencyMin: -100 };

      expect(updateRouteSchema.safeParse(valid).success).toBe(true);
      expect(updateRouteSchema.safeParse(invalid).success).toBe(false);
    });
  });

  describe("saveCanvasStateSchema", () => {
    it("should validate all required keys are strings", () => {
      const valid = {
        projectId: "proj-1",
        nodes: "[]",
        edges: "[]",
        viewport: "{}",
      };
      expect(saveCanvasStateSchema.safeParse(valid).success).toBe(true);

      const missingEdges = {
        projectId: "proj-1",
        nodes: "[]",
        viewport: "{}",
      };
      expect(saveCanvasStateSchema.safeParse(missingEdges).success).toBe(false);
    });
  });
});
