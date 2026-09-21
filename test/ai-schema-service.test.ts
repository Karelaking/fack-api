import { describe, it, expect } from "vitest";
import {
  convertPropertiesToJsonSchema,
  synthesizeRouteResponseSchema,
  validateResponseSchema,
} from "../lib/services/schema.service";
import type { GeneratedProperty } from "../lib/types/ai.type";

describe("AI API Architect — Schema Domain Service", () => {
  it("should convert primitive properties to JSON Schema with x-faker and faker attributes", () => {
    const properties: GeneratedProperty[] = [
      {
        name: "id",
        type: "string",
        fakerProvider: "string.uuid",
        nullable: false,
      },
      {
        name: "fullName",
        type: "string",
        fakerProvider: "person.fullName",
        nullable: true,
      },
      {
        name: "score",
        type: "number",
        fakerProvider: "number.int",
      },
    ];

    const schema = convertPropertiesToJsonSchema(properties);

    expect(schema.type).toBe("object");
    expect(schema.required).toContain("id");
    expect(schema.required).not.toContain("fullName");

    expect(schema.properties["id"]).toMatchObject({
      type: "string",
      "x-faker": "string.uuid",
      faker: "string.uuid",
      format: "uuid",
    });

    expect(schema.properties["fullName"]).toMatchObject({
      type: ["string", "null"],
      "x-faker": "person.fullName",
    });
  });

  it("should convert nested object properties recursively", () => {
    const properties: GeneratedProperty[] = [
      {
        name: "address",
        type: "object",
        children: [
          {
            name: "city",
            type: "string",
            fakerProvider: "location.city",
          },
          {
            name: "country",
            type: "string",
            fakerProvider: "location.country",
          },
        ],
      },
    ];

    const schema = convertPropertiesToJsonSchema(properties);
    expect(schema.properties["address"].type).toBe("object");
    expect(schema.properties["address"].properties?.["city"]).toMatchObject({
      type: "string",
      "x-faker": "location.city",
    });
  });

  it("should handle array items with faker providers", () => {
    const properties: GeneratedProperty[] = [
      {
        name: "tags",
        type: "array",
        arrayItemType: "string",
        arrayItemFakerProvider: "lorem.words",
      },
    ];

    const schema = convertPropertiesToJsonSchema(properties);
    expect(schema.properties["tags"].type).toBe("array");
    expect(schema.properties["tags"].items).toMatchObject({
      type: "string",
      "x-faker": "lorem.words",
    });
  });

  it("should synthesize a valid stringified JSON Schema document", () => {
    const properties: GeneratedProperty[] = [
      { name: "title", type: "string", fakerProvider: "commerce.productName" },
    ];

    const jsonString = synthesizeRouteResponseSchema(properties);
    expect(typeof jsonString).toBe("string");
    expect(validateResponseSchema(jsonString)).toBe(true);

    const parsed = JSON.parse(jsonString);
    expect(parsed.properties.title["x-faker"]).toBe("commerce.productName");
  });
});
