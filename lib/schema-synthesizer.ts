/**
 * Fack API's — Schema Synthesizer
 *
 * Converts the visual field tree (as managed by the Zustand schema store)
 * into a valid JSON Schema document with `x-faker` extension keywords.
 *
 * This is the critical bridge between the Control Plane (UI) and the
 * Data Plane (mock engine). The generated JSON Schema is:
 *
 * 1. Stored in the database as the route's `responseSchema`
 * 2. Consumed by `json-schema-faker` to generate dynamic payloads
 * 3. Fed to `json-schema-to-typescript` for TypeScript interface generation
 *
 * @see https://json-schema.org/understanding-json-schema/
 * @see https://github.com/json-schema-faker/json-schema-faker
 */

// ─── Types ───────────────────────────────────────────────────────────────────

/**
 * Represents a single field in the visual schema builder.
 * This is the internal data structure used by the Zustand store.
 */
export interface SchemaField {
  /** Unique identifier for this field */
  id: string;
  /** Field name (property key in the JSON response) */
  name: string;
  /** JSON Schema data type */
  type: "string" | "number" | "integer" | "boolean" | "object" | "array";
  /** Whether this field can return null */
  nullable: boolean;
  /** Faker.js provider method path (e.g., "person.firstName") */
  fakerProvider?: string;
  /** Child fields (only for type "object") */
  children?: SchemaField[];
  /** Item schema (only for type "array") */
  arrayItemType?: "string" | "number" | "integer" | "boolean" | "object";
  /** Child fields for array items of type "object" */
  arrayItemChildren?: SchemaField[];
  /** Faker.js provider for array items of primitive types */
  arrayItemFakerProvider?: string;
}

// ─── JSON Schema Types ───────────────────────────────────────────────────────

interface JsonSchemaProperty {
  type: string | string[];
  properties?: Record<string, JsonSchemaProperty>;
  required?: string[];
  items?: JsonSchemaProperty;
  "x-faker"?: string;
  format?: string;
}

interface JsonSchema {
  type: "object";
  properties: Record<string, JsonSchemaProperty>;
  required: string[];
}

// ─── Synthesizer ─────────────────────────────────────────────────────────────

/**
 * Synthesizes a JSON Schema from an array of SchemaField definitions.
 *
 * Handles:
 * - Primitive types (string, number, integer, boolean)
 * - Nested objects (recursive)
 * - Arrays with typed items
 * - Nullable fields (union types)
 * - Faker.js provider annotations via `x-faker`
 *
 * @param fields - The root-level field definitions from the schema store
 * @returns A valid JSON Schema document ready for storage and data generation
 *
 * @example
 * ```ts
 * const schema = synthesizeSchema([
 *   { id: "1", name: "id", type: "string", nullable: false, fakerProvider: "string.uuid" },
 *   { id: "2", name: "name", type: "string", nullable: false, fakerProvider: "person.fullName" },
 *   { id: "3", name: "email", type: "string", nullable: true, fakerProvider: "internet.email" },
 * ]);
 * // Result:
 * // {
 * //   type: "object",
 * //   properties: {
 * //     id: { type: "string", "x-faker": "string.uuid" },
 * //     name: { type: "string", "x-faker": "person.fullName" },
 * //     email: { type: ["string", "null"], "x-faker": "internet.email" }
 * //   },
 * //   required: ["id", "name"]
 * // }
 * ```
 */
export function synthesizeSchema(fields: SchemaField[]): JsonSchema {
  const properties: Record<string, JsonSchemaProperty> = {};
  const required: string[] = [];

  for (const field of fields) {
    if (!field.name.trim()) continue;

    properties[field.name] = synthesizeField(field);

    // Non-nullable fields are required
    if (!field.nullable) {
      required.push(field.name);
    }
  }

  return {
    type: "object",
    properties,
    required,
  };
}

/**
 * Synthesizes a single field into its JSON Schema representation.
 * Recursively processes nested objects and array items.
 */
function synthesizeField(field: SchemaField): JsonSchemaProperty {
  const property: JsonSchemaProperty = {
    type: field.nullable ? [field.type, "null"] : field.type,
  };

  // Attach Faker.js provider annotation
  if (field.fakerProvider) {
    property["x-faker"] = field.fakerProvider;
  }

  // Handle UUID format shorthand
  if (field.fakerProvider === "string.uuid") {
    property.format = "uuid";
  }

  // Handle nested object properties
  if (field.type === "object" && field.children?.length) {
    const nestedSchema = synthesizeSchema(field.children);
    property.properties = nestedSchema.properties;
    if (nestedSchema.required.length > 0) {
      property.required = nestedSchema.required;
    }
  }

  // Handle array items
  if (field.type === "array") {
    property.items = synthesizeArrayItems(field);
  }

  return property;
}

/**
 * Synthesizes the `items` schema for array-type fields.
 * Supports both primitive array items and object array items.
 */
function synthesizeArrayItems(field: SchemaField): JsonSchemaProperty {
  const itemType = field.arrayItemType ?? "string";

  if (itemType === "object" && field.arrayItemChildren?.length) {
    const nestedSchema = synthesizeSchema(field.arrayItemChildren);
    return {
      type: "object",
      properties: nestedSchema.properties,
      required: nestedSchema.required,
    };
  }

  const items: JsonSchemaProperty = { type: itemType };
  if (field.arrayItemFakerProvider) {
    items["x-faker"] = field.arrayItemFakerProvider;
  }

  return items;
}

/**
 * Parses a JSON Schema document back into an array of SchemaField definitions.
 * This is the inverse of `synthesizeSchema` and is used to populate the
 * Edit Bar when loading an existing route's schema from the database.
 *
 * @param schema - A JSON Schema document (as stored in the database)
 * @returns An array of SchemaField definitions for the Zustand store
 */
export function parseSchemaToFields(schema: JsonSchema): SchemaField[] {
  if (!schema?.properties) return [];

  const requiredSet = new Set(schema.required ?? []);

  return Object.entries(schema.properties).map(([name, prop], index) => {
    const isNullable = Array.isArray(prop.type) && prop.type.includes("null");
    const baseType = Array.isArray(prop.type)
      ? (prop.type.find((t) => t !== "null") as SchemaField["type"])
      : (prop.type as SchemaField["type"]);

    const field: SchemaField = {
      id: `field-${index}-${Date.now()}`,
      name,
      type: baseType ?? "string",
      nullable: isNullable || !requiredSet.has(name),
      fakerProvider: prop["x-faker"],
    };

    // Parse nested object children
    if (baseType === "object" && prop.properties) {
      field.children = parseSchemaToFields({
        type: "object",
        properties: prop.properties,
        required: prop.required ?? [],
      });
    }

    // Parse array item definitions
    if (baseType === "array" && prop.items) {
      field.arrayItemType = (
        Array.isArray(prop.items.type)
          ? prop.items.type.find((t) => t !== "null")
          : prop.items.type
      ) as SchemaField["arrayItemType"];

      if (field.arrayItemType === "object" && prop.items.properties) {
        field.arrayItemChildren = parseSchemaToFields({
          type: "object",
          properties: prop.items.properties,
          required: prop.items.required ?? [],
        });
      } else {
        field.arrayItemFakerProvider = prop.items["x-faker"];
      }
    }

    return field;
  });
}
