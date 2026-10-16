/**
 * Fack AI API Architect — Schema Domain Service
 *
 * Converts AI-generated property descriptors into Fack's JSON Schema format
 * annotated with `x-faker` and `faker` directives for json-schema-faker.
 */

import type { GeneratedProperty } from "@/lib/ai/types";
import { normalizeFakerProvider } from "@/lib/ai/faker-providers.constant";

export interface JsonSchemaDocument {
  type: "object";
  properties: Record<string, JsonSchemaNode>;
  required: string[];
}

export interface JsonSchemaNode {
  type: string | string[];
  properties?: Record<string, JsonSchemaNode>;
  required?: string[];
  items?: JsonSchemaNode;
  "x-faker"?: string;
  faker?: string;
  format?: string;
}

/**
 * Recursively converts a single GeneratedProperty to a JsonSchemaNode.
 */
function convertPropertyToNode(prop: GeneratedProperty): JsonSchemaNode {
  const isNullable = Boolean(prop.nullable);
  const nodeType = isNullable ? [prop.type, "null"] : prop.type;
  const node: JsonSchemaNode = {
    type: nodeType,
  };

  const provider = normalizeFakerProvider(prop.fakerProvider);
  if (provider) {
    node["x-faker"] = provider;
    node["faker"] = provider;
    if (provider === "string.uuid") {
      node.format = "uuid";
    }
  }

  if (prop.type === "object" && prop.children && prop.children.length > 0) {
    const nestedDoc = convertPropertiesToJsonSchema(prop.children);
    node.properties = nestedDoc.properties;
    if (nestedDoc.required.length > 0) {
      node.required = nestedDoc.required;
    }
  }

  if (prop.type === "array") {
    const itemType = prop.arrayItemType ?? "object";
    if (
      itemType === "object" &&
      prop.arrayItemChildren &&
      prop.arrayItemChildren.length > 0
    ) {
      const nestedDoc = convertPropertiesToJsonSchema(prop.arrayItemChildren);
      node.items = {
        type: "object",
        properties: nestedDoc.properties,
        required: nestedDoc.required,
      };
    } else {
      const itemNode: JsonSchemaNode = {
        type: itemType,
      };
      const itemProvider = normalizeFakerProvider(prop.arrayItemFakerProvider);
      if (itemProvider) {
        itemNode["x-faker"] = itemProvider;
        itemNode["faker"] = itemProvider;
        if (itemProvider === "string.uuid") {
          itemNode.format = "uuid";
        }
      }
      node.items = itemNode;
    }
  }

  return node;
}

/**
 * Converts an array of GeneratedProperty descriptors to a complete JSON Schema document.
 */
export function convertPropertiesToJsonSchema(
  properties: GeneratedProperty[],
): JsonSchemaDocument {
  const schemaProps: Record<string, JsonSchemaNode> = {};
  const required: string[] = [];

  for (const prop of properties) {
    const name = prop.name.trim();
    if (!name) {
      continue;
    }

    schemaProps[name] = convertPropertyToNode(prop);
    if (!prop.nullable) {
      required.push(name);
    }
  }

  return {
    type: "object",
    properties: schemaProps,
    required,
  };
}

/**
 * Synthesizes a JSON string representation of a route's response schema.
 */
export function synthesizeRouteResponseSchema(
  properties: GeneratedProperty[],
): string {
  if (!properties || properties.length === 0) {
    return "{}";
  }

  const doc = convertPropertiesToJsonSchema(properties);
  return JSON.stringify(doc, null, 2);
}

/**
 * Validates whether a response schema string is valid JSON Schema.
 */
export function validateResponseSchema(schemaJson: string): boolean {
  if (!schemaJson || schemaJson.trim() === "{}") {
    return true;
  }

  try {
    const parsed = JSON.parse(schemaJson) as Record<string, unknown>;
    if (typeof parsed !== "object" || parsed === null) {
      return false;
    }
    return true;
  } catch {
    return false;
  }
}
