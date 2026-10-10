/* oxlint-disable @typescript-eslint/no-explicit-any */
import type {
  GeneratedApi,
  GeneratedEndpoint,
  GeneratedProperty,
  JsonSchemaPropertyType,
} from "@/lib/types/ai.type";
import type { HttpMethod } from "@/db/schema";
import { toProfessionalApiName } from "@/lib/ai/ai-fallback-synthesizer.constant";

/**
 * Maps OpenAPI schema properties to our recursive GeneratedProperty format.
 */

function parseOpenApiSchemaProperties(schema: any): GeneratedProperty[] {
  if (!schema || typeof schema !== "object") return [];

  const properties: GeneratedProperty[] = [];

  // Handle direct properties
  if (schema.properties) {
    for (const [key, propSchema] of Object.entries<any>(schema.properties)) {
      const typeStr = (propSchema.type || "string").toLowerCase();
      let mappedType: JsonSchemaPropertyType = "string";
      if (
        ["string", "number", "integer", "boolean", "object", "array"].includes(
          typeStr,
        )
      ) {
        mappedType = typeStr as JsonSchemaPropertyType;
      }

      const prop: GeneratedProperty = {
        name: key,
        type: mappedType,
        nullable: propSchema.nullable || false,
      };

      // Best effort faker provider mapping based on name
      const lowerKey = key.toLowerCase();
      if (mappedType === "string") {
        if (lowerKey.includes("email")) prop.fakerProvider = "internet.email";
        else if (lowerKey.includes("name"))
          prop.fakerProvider = "person.fullName";
        else if (lowerKey.includes("phone"))
          prop.fakerProvider = "phone.number";
        else if (lowerKey.includes("url") || lowerKey.includes("website"))
          prop.fakerProvider = "internet.url";
        else if (lowerKey.includes("id") || lowerKey.includes("uuid"))
          prop.fakerProvider = "string.uuid";
        else if (lowerKey.includes("date") || lowerKey.includes("time"))
          prop.fakerProvider = "date.recent";
        else if (
          lowerKey.includes("avatar") ||
          lowerKey.includes("image") ||
          lowerKey.includes("picture")
        )
          prop.fakerProvider = "image.avatar";
        else if (lowerKey.includes("company"))
          prop.fakerProvider = "company.name";
        else if (lowerKey.includes("address"))
          prop.fakerProvider = "location.streetAddress";
        else if (lowerKey.includes("city"))
          prop.fakerProvider = "location.city";
        else if (lowerKey.includes("state"))
          prop.fakerProvider = "location.state";
        else if (lowerKey.includes("zip"))
          prop.fakerProvider = "location.zipCode";
        else if (lowerKey.includes("country"))
          prop.fakerProvider = "location.country";
        else if (lowerKey.includes("color")) prop.fakerProvider = "color.human";
        else if (
          lowerKey.includes("description") ||
          lowerKey.includes("content")
        )
          prop.fakerProvider = "lorem.paragraph";
        else prop.fakerProvider = "lorem.word";
      } else if (mappedType === "number" || mappedType === "integer") {
        if (
          lowerKey.includes("price") ||
          lowerKey.includes("amount") ||
          lowerKey.includes("cost") ||
          lowerKey.includes("total")
        )
          prop.fakerProvider = "commerce.price";
        else prop.fakerProvider = "number.int";
      } else if (mappedType === "boolean") {
        prop.fakerProvider = "datatype.boolean";
      }

      if (mappedType === "object" && propSchema.properties) {
        prop.children = parseOpenApiSchemaProperties(propSchema);
      } else if (mappedType === "array" && propSchema.items) {
        const itemType = (propSchema.items.type || "string").toLowerCase();
        if (
          ["string", "number", "integer", "boolean", "object"].includes(
            itemType,
          )
        ) {
          prop.arrayItemType = itemType as any;
          if (itemType === "object" && propSchema.items.properties) {
            prop.arrayItemChildren = parseOpenApiSchemaProperties(
              propSchema.items,
            );
          } else {
            prop.arrayItemFakerProvider = "lorem.word";
          }
        }
      }

      properties.push(prop);
    }
  }

  // Handle arrays at the root of the schema
  if (schema.type === "array" && schema.items) {
    const itemType = (schema.items.type || "string").toLowerCase();
    const prop: GeneratedProperty = {
      name: "items",
      type: "array",
      nullable: false,
    };
    if (
      ["string", "number", "integer", "boolean", "object"].includes(itemType)
    ) {
      prop.arrayItemType = itemType as any;
      if (itemType === "object" && schema.items.properties) {
        prop.arrayItemChildren = parseOpenApiSchemaProperties(schema.items);
      }
    }
    properties.push(prop);
  }

  return properties;
}

/**
 * Parses an OpenAPI Document object into a GeneratedApi.
 */

export function parseOpenApiDocument(doc: any): GeneratedApi {
  if (!doc || !doc.paths) {
    throw new Error("Invalid OpenAPI document: missing paths object.");
  }

  const endpointsMap = new Map<string, GeneratedEndpoint>();

  for (const [pathStr, pathObj] of Object.entries<any>(doc.paths)) {
    // Determine a base path by looking at the first segment
    const segments = pathStr.split("/").filter(Boolean);
    const baseSegment = segments.length > 0 ? `/${segments[0]}` : "/api";

    // Group endpoints by baseSegment
    let endpoint = endpointsMap.get(baseSegment);
    if (!endpoint) {
      endpoint = {
        name: segments[0]
          ? segments[0].charAt(0).toUpperCase() + segments[0].slice(1)
          : "API",
        basePath: baseSegment,
        routes: [],
      };
      endpointsMap.set(baseSegment, endpoint);
    }

    // Relative path for the route
    const relativePath = pathStr.startsWith(baseSegment)
      ? pathStr.slice(baseSegment.length)
      : pathStr;
    const finalRoutePath = relativePath.startsWith("/")
      ? relativePath
      : `/${relativePath}`;

    const supportedMethods = ["get", "post", "put", "patch", "delete"];
    for (const method of supportedMethods) {
      const operation = pathObj[method];
      if (operation) {
        let properties: GeneratedProperty[] = [];
        let statusCode = method === "post" ? 201 : 200;

        // Try to extract response schema
        if (operation.responses) {
          const successCodes = ["200", "201", "202", "default"];
          let successResponse = null;
          for (const code of successCodes) {
            if (operation.responses[code]) {
              successResponse = operation.responses[code];
              if (code !== "default") statusCode = parseInt(code, 10);
              break;
            }
          }

          if (
            successResponse &&
            successResponse.content &&
            successResponse.content["application/json"]
          ) {
            const schema = successResponse.content["application/json"].schema;
            // Note: Does not resolve $ref. In a real-world scenario we'd need to resolve refs first.
            properties = parseOpenApiSchemaProperties(schema);
          }
        }

        endpoint.routes.push({
          method: method.toUpperCase() as HttpMethod,
          path: finalRoutePath === "/" ? "" : finalRoutePath, // AiValidator normalization expects no trailing slash for root routes usually, but empty string is safe
          statusCode,
          description: operation.summary || operation.description || "",
          properties,
          latency: { min: 100, max: 500 }, // Default values
          errorRate: 0.05,
        });
      }
    }
  }

  const endpoints = Array.from(endpointsMap.values()).map((ep) => {
    // If all routes end up with an empty path, ensure it has at least one '/' if needed
    ep.routes.forEach((r) => {
      if (!r.path) r.path = "/";
    });
    return ep;
  });

  const rawName = doc.info?.title || "Imported API";
  const apiName = toProfessionalApiName(
    rawName,
    endpoints.map((e) => e.name),
  );

  return {
    name: apiName,
    description: doc.info?.description || "",
    endpoints,
  };
}
