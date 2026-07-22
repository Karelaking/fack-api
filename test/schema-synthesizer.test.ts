import { describe, it, expect } from "vitest";
import {
  synthesizeSchema,
  parseSchemaToFields,
  type SchemaField,
} from "../lib/schema-synthesizer";

describe("Schema Synthesizer", () => {
  const fields: SchemaField[] = [
    {
      id: "f-1",
      name: "id",
      type: "string",
      nullable: false,
      fakerProvider: "string.uuid",
    },
    {
      id: "f-2",
      name: "name",
      type: "string",
      nullable: true,
      fakerProvider: "person.fullName",
    },
    {
      id: "f-3",
      name: "profile",
      type: "object",
      nullable: false,
      children: [
        {
          id: "f-3-1",
          name: "age",
          type: "integer",
          nullable: false,
          fakerProvider: "number.int",
        },
      ],
    },
    {
      id: "f-4",
      name: "tags",
      type: "array",
      nullable: false,
      arrayItemType: "string",
      arrayItemFakerProvider: "word.noun",
    },
  ];

  it("should synthesize a valid JSON Schema with extension keywords", () => {
    const schema = synthesizeSchema(fields);

    expect(schema.type).toBe("object");
    expect(schema.required).toContain("id");
    expect(schema.required).toContain("profile");
    expect(schema.required).toContain("tags");
    expect(schema.required).not.toContain("name"); // nullable

    expect(schema.properties.id).toEqual({
      type: "string",
      "x-faker": "string.uuid",
      faker: "string.uuid",
      format: "uuid",
    });

    expect(schema.properties.name).toEqual({
      type: ["string", "null"],
      "x-faker": "person.fullName",
      faker: "person.fullName",
    });

    expect(schema.properties.profile).toEqual({
      type: "object",
      properties: {
        age: {
          type: "integer",
          "x-faker": "number.int",
          faker: "number.int",
        },
      },
      required: ["age"],
    });

    expect(schema.properties.tags).toEqual({
      type: "array",
      items: {
        type: "string",
        "x-faker": "word.noun",
        faker: "word.noun",
      },
    });
  });

  it("should skip fields with empty names", () => {
    const emptyFieldList: SchemaField[] = [
      { id: "f-empty", name: "   ", type: "string", nullable: false },
      { id: "f-valid", name: "ok", type: "string", nullable: false },
    ];
    const schema = synthesizeSchema(emptyFieldList);
    expect(schema.properties).toHaveProperty("ok");
    expect(schema.properties).not.toHaveProperty("   ");
  });

  it("should parse synthesized schema back to fields structure", () => {
    const schema = synthesizeSchema(fields);
    const parsedFields = parseSchemaToFields(schema);

    expect(parsedFields).toHaveLength(4);

    const idField = parsedFields.find((f) => f.name === "id");
    expect(idField).toBeDefined();
    expect(idField?.type).toBe("string");
    expect(idField?.nullable).toBe(false);
    expect(idField?.fakerProvider).toBe("string.uuid");

    const nameField = parsedFields.find((f) => f.name === "name");
    expect(nameField?.nullable).toBe(true);
    expect(nameField?.fakerProvider).toBe("person.fullName");

    const profileField = parsedFields.find((f) => f.name === "profile");
    expect(profileField?.children).toBeDefined();
    expect(profileField?.children?.[0].name).toBe("age");
    expect(profileField?.children?.[0].type).toBe("integer");

    const tagsField = parsedFields.find((f) => f.name === "tags");
    expect(tagsField?.arrayItemType).toBe("string");
    expect(tagsField?.arrayItemFakerProvider).toBe("word.noun");
  });

  it("should handle deeply nested schemas and multi-level structure parse/synthesis", () => {
    const deepFields: SchemaField[] = [
      {
        id: "l1",
        name: "user",
        type: "object",
        nullable: false,
        children: [
          {
            id: "l2",
            name: "address",
            type: "object",
            nullable: false,
            children: [
              {
                id: "l3",
                name: "geo",
                type: "object",
                nullable: false,
                children: [
                  {
                    id: "l4",
                    name: "lat",
                    type: "number",
                    nullable: false,
                    fakerProvider: "location.latitude",
                  },
                ],
              },
            ],
          },
        ],
      },
    ];

    const schema = synthesizeSchema(deepFields);

    // Test nested synthesis
    expect(
      schema.properties.user.properties?.address.properties?.geo.properties
        ?.lat,
    ).toEqual({
      type: "number",
      "x-faker": "location.latitude",
      faker: "location.latitude",
    });

    // Test nested parsing round-trip
    const parsed = parseSchemaToFields(schema);
    expect(parsed[0].children?.[0].children?.[0].children?.[0].name).toBe(
      "lat",
    );
    expect(
      parsed[0].children?.[0].children?.[0].children?.[0].fakerProvider,
    ).toBe("location.latitude");
  });

  it("should synthesize array items of object type containing sub-properties", () => {
    const arrayObjectFields: SchemaField[] = [
      {
        id: "a-1",
        name: "usersList",
        type: "array",
        nullable: false,
        arrayItemType: "object",
        arrayItemChildren: [
          {
            id: "a-1-child",
            name: "username",
            type: "string",
            nullable: false,
            fakerProvider: "internet.username",
          },
        ],
      },
    ];

    const schema = synthesizeSchema(arrayObjectFields);
    expect(schema.properties.usersList.items).toEqual({
      type: "object",
      properties: {
        username: {
          type: "string",
          "x-faker": "internet.username",
          faker: "internet.username",
        },
      },
      required: ["username"],
    });

    const parsed = parseSchemaToFields(schema);
    expect(parsed[0].arrayItemType).toBe("object");
    expect(parsed[0].arrayItemChildren?.[0].name).toBe("username");
    expect(parsed[0].arrayItemChildren?.[0].fakerProvider).toBe(
      "internet.username",
    );
  });
});
