import { generate } from "json-schema-faker";
import { faker } from "@faker-js/faker";
import { LoggerRegistry } from "@/lib/logger-registry";
import { toStr } from "@/lib/utils/coerce";
import type { NextRequest } from "next/server";

// ─── Types ───────────────────────────────────────────────────────────────────

export interface CustomHeaders {
  [key: string]: string;
}

const mockTrace = LoggerRegistry.getTrace("mock");

/**
 * Generates a fake data payload from a JSON Schema document.
 */
/**
 * Recursively maps any "x-faker" properties in a JSON Schema to "faker".
 */
function createLoremFlickrUrl(category: string): string {
  const lockSeed = Math.floor(Math.random() * 100000);
  return `https://loremflickr.com/640/480/${category}?lock=${lockSeed}`;
}

function createPicsumUrl(width: number, height: number): string {
  const jitterSeed = Math.floor(Math.random() * 100000);
  return `https://picsum.photos/${width}/${height}?random=${jitterSeed}`;
}

const extendedFaker = Object.assign({}, faker, {
  image: new Proxy(
    Object.assign({}, faker.image, {
      sports: () => createLoremFlickrUrl("sports"),
      animals: () => createLoremFlickrUrl("animals"),
      business: () => createLoremFlickrUrl("business"),
      cats: () => createLoremFlickrUrl("cats"),
      city: () => createLoremFlickrUrl("city"),
      fashion: () => createLoremFlickrUrl("fashion"),
      food: () => createLoremFlickrUrl("food"),
      nature: () => createLoremFlickrUrl("nature"),
      technics: () => createLoremFlickrUrl("technics"),
      transport: () => createLoremFlickrUrl("transport"),
      abstract: () => createLoremFlickrUrl("abstract"),
      people: () => createLoremFlickrUrl("people"),
      nightlife: () => createLoremFlickrUrl("nightlife"),
      urlSquare: () => createPicsumUrl(200, 200),
      urlThumbnail: () => createPicsumUrl(150, 150),
      urlHD: () => createPicsumUrl(1280, 720),
      urlFullHD: () => createPicsumUrl(1920, 1080),
    }),
    {
      get(target, prop) {
        if (typeof prop === "string" && prop.startsWith("customCategory:")) {
          const category = prop.slice("customCategory:".length) || "random";
          return () => createLoremFlickrUrl(category);
        }
        if (prop === "customCategory") {
          return () => createLoremFlickrUrl("random");
        }
        return Reflect.get(target, prop);
      },
    },
  ),
});

/**
 * Recursively maps any "x-faker" properties in a JSON Schema to "faker".
 */
function mapXFakerToFaker(obj: unknown): unknown {
  if (typeof obj !== "object" || obj === null) {
    return obj;
  }

  if (Array.isArray(obj)) {
    return obj.map(mapXFakerToFaker);
  }

  const mappedSchema: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(obj as Record<string, unknown>)) {
    if (key === "x-faker") {
      mappedSchema["faker"] = value;
    } else {
      mappedSchema[key] = mapXFakerToFaker(value);
    }
  }
  return mappedSchema;
}

export async function generatePayload(
  schema: Record<string, unknown>,
  limit?: number,
): Promise<unknown> {
  mockTrace.traceCall(
    "generatePayload",
    `${toStr(schema.type) || "object"} schema`,
    `limit: ${limit}`,
  );
  try {
    const transformedSchema = mapXFakerToFaker(schema);
    const minItems = limit !== undefined ? limit : 1;
    const maxItems = limit !== undefined ? limit : 1;

    const generatedPayload = await generate(
      transformedSchema as Parameters<typeof generate>[0],
      {
        alwaysFakeOptionals: true,
        useDefaultValue: true,
        minItems,
        maxItems,
        extensions: {
          faker: extendedFaker as unknown as Record<string, unknown>,
        },
      },
    );
    mockTrace.traceSuccess("generatePayload", "Generated successfully");
    return generatedPayload;
  } catch (error) {
    mockTrace.traceError("generatePayload", error);
    return { error: "Failed to generate mock data", details: String(error) };
  }
}

// ─── Chaos Simulation ────────────────────────────────────────────────────────

export async function applyLatency(min: number, max: number): Promise<void> {
  mockTrace.traceCall("applyLatency", min, max);
  if (min <= 0 && max <= 0) {
    mockTrace.traceSuccess("applyLatency", "skipped (0 delay)");
    return;
  }

  const effectiveMin = Math.max(0, min);
  const effectiveMax = Math.max(effectiveMin, max);
  const delay =
    Math.floor(Math.random() * (effectiveMax - effectiveMin + 1)) +
    effectiveMin;

  await new Promise((resolve) => setTimeout(resolve, delay));
  mockTrace.traceSuccess("applyLatency", `Delayed by ${delay}ms`);
}

export function shouldError(errorRate: number): boolean {
  mockTrace.traceCall("shouldError", errorRate);
  if (errorRate <= 0) {
    mockTrace.traceSuccess("shouldError", false);
    return false;
  }
  if (errorRate >= 100) {
    mockTrace.traceSuccess("shouldError", true);
    return true;
  }
  const isErrorHit = Math.random() * 100 < errorRate;
  mockTrace.traceSuccess("shouldError", isErrorHit);
  return isErrorHit;
}

// ─── Response Building ───────────────────────────────────────────────────────

const CORS_HEADERS: Record<string, string> = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, PATCH, OPTIONS",
  "Access-Control-Allow-Headers":
    "Content-Type, Authorization, X-Requested-With",
  "Access-Control-Max-Age": "86400",
};

export function buildResponse(
  payload: unknown,
  statusCode: number = 200,
  customHeaders: CustomHeaders = {},
): Response {
  mockTrace.traceCall("buildResponse", `status: ${statusCode}`);
  const headers = new Headers({
    "Content-Type": "application/json",
    "X-Powered-By": "Fack API's",
    "X-Accel-Buffering": "no",
    "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
    Pragma: "no-cache",
    Expires: "0",
    ...CORS_HEADERS,
    ...customHeaders,
  });

  const response = new Response(JSON.stringify(payload, null, 2), {
    status: statusCode,
    headers,
  });
  mockTrace.traceSuccess("buildResponse", `Response created: ${statusCode}`);
  return response;
}

export function buildCorsPreflightResponse(): Response {
  mockTrace.traceCall("buildCorsPreflightResponse");
  const response = new Response(null, {
    status: 204,
    headers: new Headers(CORS_HEADERS),
  });
  mockTrace.traceSuccess("buildCorsPreflightResponse", "204 preflight created");
  return response;
}

export function buildErrorResponse(
  statusCode: number = 500,
  message: string = "Internal Server Error",
): Response {
  mockTrace.traceCall("buildErrorResponse", statusCode, message);
  const response = buildResponse(
    {
      error: true,
      statusCode,
      message,
      timestamp: new Date().toISOString(),
    },
    statusCode,
  );
  mockTrace.traceSuccess("buildErrorResponse", `Error response: ${statusCode}`);
  return response;
}

// ─── Query Parameters Filtering ──────────────────────────────────────────────

export function processQueryParameters(
  payload: unknown,
  searchParams: URLSearchParams,
): unknown {
  mockTrace.traceCall("processQueryParameters", searchParams.toString());
  if (!payload) {
    mockTrace.traceSuccess("processQueryParameters", payload);
    return payload;
  }

  const processArray = (items: unknown[]): unknown[] => {
    if (!Array.isArray(items) || items.length === 0) return items;

    let filteredItems = [...items];

    const specialKeys = new Set([
      "limit",
      "_limit",
      "count",
      "page",
      "_page",
      "sort",
      "_sort",
      "order",
      "_order",
      "q",
    ]);

    // 1. Filtering
    for (const [key, value] of searchParams.entries()) {
      if (specialKeys.has(key)) continue;

      filteredItems = filteredItems.filter((item) => {
        if (item && typeof item === "object") {
          const itemObj = item as Record<string, unknown>;
          if (key in itemObj) {
            const itemValue = itemObj[key];
            if (itemValue === undefined || itemValue === null) return false;
            return toStr(itemValue).toLowerCase() === value.toLowerCase();
          }
        }
        return true;
      });
    }

    // 2. Global search
    const query = searchParams.get("q");
    if (query) {
      const lowerQuery = query.toLowerCase();
      filteredItems = filteredItems.filter((item) => {
        if (!item || typeof item !== "object") return false;
        return Object.values(item as Record<string, unknown>).some(
          (val) =>
            val !== null &&
            val !== undefined &&
            toStr(val).toLowerCase().includes(lowerQuery),
        );
      });
    }

    // 3. Sorting
    const sortBy = searchParams.get("sort") || searchParams.get("_sort");
    if (sortBy) {
      const order = (
        searchParams.get("order") ||
        searchParams.get("_order") ||
        "asc"
      ).toLowerCase();
      filteredItems.sort((a, b) => {
        const leftValue =
          a && typeof a === "object"
            ? (a as Record<string, unknown>)[sortBy]
            : undefined;
        const rightValue =
          b && typeof b === "object"
            ? (b as Record<string, unknown>)[sortBy]
            : undefined;

        if (leftValue === undefined || leftValue === null) return 1;
        if (rightValue === undefined || rightValue === null) return -1;

        if (typeof leftValue === "number" && typeof rightValue === "number") {
          return order === "desc"
            ? rightValue - leftValue
            : leftValue - rightValue;
        }

        const strA = toStr(leftValue).toLowerCase();
        const strB = toStr(rightValue).toLowerCase();
        if (strA < strB) return order === "desc" ? 1 : -1;
        if (strA > strB) return order === "desc" ? -1 : 1;
        return 0;
      });
    }

    // 4. Pagination
    const pageParam = searchParams.get("page") || searchParams.get("_page");
    const limitParam =
      searchParams.get("limit") ||
      searchParams.get("_limit") ||
      searchParams.get("count");

    if (limitParam) {
      const limit = parseInt(limitParam, 10);
      if (!isNaN(limit) && limit > 0) {
        const page = pageParam ? parseInt(pageParam, 10) : 1;
        const parsedPage = !isNaN(page) && page > 0 ? page : 1;
        const startIndex = (parsedPage - 1) * limit;
        const endIndex = parsedPage * limit;
        filteredItems = filteredItems.slice(startIndex, endIndex);
      }
    } else if (pageParam) {
      const page = parseInt(pageParam, 10);
      if (!isNaN(page) && page > 0) {
        const startIndex = (page - 1) * 10;
        const endIndex = page * 10;
        filteredItems = filteredItems.slice(startIndex, endIndex);
      }
    }

    return filteredItems;
  };

  if (Array.isArray(payload)) {
    const processedItems = processArray(payload);
    mockTrace.traceSuccess(
      "processQueryParameters (array)",
      `${processedItems.length} items`,
    );
    return processedItems;
  }

  if (typeof payload === "object" && payload !== null) {
    const processedObject: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(
      payload as Record<string, unknown>,
    )) {
      if (Array.isArray(value)) {
        processedObject[key] = processArray(value);
      } else {
        processedObject[key] = value;
      }
    }
    mockTrace.traceSuccess(
      "processQueryParameters (object)",
      "processed array properties",
    );
    return processedObject;
  }

  mockTrace.traceSuccess("processQueryParameters (passthrough)", payload);
  return payload;
}

// ─── Conditional Rules Evaluation ───────────────────────────────────────────

export interface ConditionalRule {
  id: string;
  type: "query" | "header" | "param";
  key: string;
  operator: "equals" | "contains" | "exists";
  value: string;
  responseStatus: number;
  responseBody: string;
}

export function evaluateRules(
  conditionalRulesJson: string | null | undefined,
  request: NextRequest,
  params: Record<string, string | string[]>,
): { status: number; body: unknown } | null {
  mockTrace.traceCall("evaluateRules", request.nextUrl.pathname);
  try {
    const rules: ConditionalRule[] = JSON.parse(conditionalRulesJson || "[]");
    if (!Array.isArray(rules) || rules.length === 0) {
      mockTrace.traceSuccess("evaluateRules (no rules)", null);
      return null;
    }

    for (const rule of rules) {
      let incomingValue: string | null = null;
      const ruleKey = rule.key || (rule as { field?: string }).field || "";

      if (rule.type === "query") {
        incomingValue = request.nextUrl.searchParams.get(ruleKey);
      } else if (rule.type === "header") {
        incomingValue = request.headers.get(ruleKey);
      } else if (rule.type === "param") {
        const paramValue = params[ruleKey];
        incomingValue = Array.isArray(paramValue)
          ? paramValue.join("/")
          : (paramValue ?? null);
      }

      let isMatch = false;
      if (rule.operator === "exists") {
        isMatch = incomingValue !== null;
      } else if (incomingValue !== null) {
        if (rule.operator === "equals") {
          isMatch = incomingValue === rule.value;
        } else if (rule.operator === "contains") {
          isMatch = incomingValue.includes(rule.value);
        }
      }

      if (isMatch) {
        let parsedBody: unknown = rule.responseBody;
        try {
          parsedBody = JSON.parse(rule.responseBody);
        } catch {
          // fallback to raw string if it's not valid JSON
        }
        const matchResult = {
          status: rule.responseStatus || 200,
          body: parsedBody,
        };
        mockTrace.traceSuccess(
          "evaluateRules (rule match)",
          matchResult.status,
        );
        return matchResult;
      }
    }
  } catch (error) {
    mockTrace.traceError("evaluateRules", error);
  }
  mockTrace.traceSuccess("evaluateRules (no match)", null);
  return null;
}
