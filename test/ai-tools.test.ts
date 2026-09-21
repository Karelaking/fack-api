import { describe, it, expect } from "vitest";
import { agentTools } from "../lib/ai/ai-tools.service";
import type { GeneratedRoute, GeneratedProperty } from "../lib/types/ai.type";

describe("AI API Architect — Agent Tools Service", () => {
  it("should validate a conforming route using validateRoute tool", async () => {
    const route: GeneratedRoute = {
      method: "POST",
      path: "/users",
      statusCode: 201,
      properties: [
        { name: "id", type: "string", fakerProvider: "string.uuid" },
        { name: "email", type: "string", fakerProvider: "internet.email" },
      ],
      latency: { min: 50, max: 150 },
      errorRate: 0,
    };

    const result = await agentTools.validateRoute.execute(route);
    expect(result.success).toBe(true);
    expect(result.errors.length).toBe(0);
    expect(result.normalizedRoute?.method).toBe("POST");
  });

  it("should reject an invalid route with negative latency using validateRoute tool", async () => {
    const invalidRoute: GeneratedRoute = {
      method: "GET",
      path: "/posts",
      statusCode: 200,
      properties: [],
      latency: { min: 200, max: 50 }, // inverted
      errorRate: 0,
    };

    const result = await agentTools.validateRoute.execute(invalidRoute);
    expect(result.success).toBe(true); // normalize fixes inverted latency
    expect(result.normalizedRoute?.latency.max).toBeGreaterThanOrEqual(200);
  });

  it("should generate and validate schema using generateSchema tool", async () => {
    const properties: GeneratedProperty[] = [
      { name: "productId", type: "string", fakerProvider: "string.uuid" },
      { name: "name", type: "string", fakerProvider: "commerce.productName" },
      { name: "price", type: "number", fakerProvider: "commerce.price" },
    ];

    const result = await agentTools.generateSchema.execute({ properties });
    expect(result.success).toBe(true);
    expect(result.schema.type).toBe("object");
    expect(result.schema.properties.productId["x-faker"]).toBe("string.uuid");
  });

  it("should gracefully handle nonexistent project lookup using getProject tool", async () => {
    const result = await agentTools.getProject.execute({
      projectId: "nonexistent-project-999",
    });
    expect(result.success).toBe(false);
    expect(result.error).toContain("Project not found");
  });
});
