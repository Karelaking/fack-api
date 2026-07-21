import { generate } from "json-schema-faker";
import { faker } from "@faker-js/faker";
import { LoggerRegistry } from "@/lib/logger-registry";
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
function mapXFakerToFaker(obj: unknown): unknown {
  logCallInternal("mapXFakerToFaker");
  if (typeof obj !== "object" || obj === null) {
    logSuccessInternal("mapXFakerToFaker", "primitive");
    return obj;
  }

  if (Array.isArray(obj)) {
    const res = obj.map(mapXFakerToFaker);
    logSuccessInternal("mapXFakerToFaker", "array");
    return res;
  }

  const result: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(obj as Record<string, unknown>)) {
    if (key === "x-faker") {
      result["faker"] = value;
    } else {
      result[key] = mapXFakerToFaker(value);
    }
  }
  logSuccessInternal("mapXFakerToFaker", "object");
  return result;
}

export async function generatePayload(
  schema: Record<string, unknown>,
  limit?: number,
): Promise<unknown> {
  mockTrace.traceCall(
    "generatePayload",
    `${schema.type || "object"} schema`,
    `limit: ${limit}`,
  );
  try {
    const transformedSchema = mapXFakerToFaker(schema);
    const minItems = limit !== undefined ? limit : 1;
    const maxItems = limit !== undefined ? limit : 1;

    const extendedFaker = {
      ...faker,
      image: new Proxy(
        {
          ...faker.image,
          sports: () =>
            `https://loremflickr.com/640/480/sports?lock=${Math.floor(Math.random() * 100000)}`,
          animals: () =>
            `https://loremflickr.com/640/480/animals?lock=${Math.floor(Math.random() * 100000)}`,
          business: () =>
            `https://loremflickr.com/640/480/business?lock=${Math.floor(Math.random() * 100000)}`,
          cats: () =>
            `https://loremflickr.com/640/480/cats?lock=${Math.floor(Math.random() * 100000)}`,
          city: () =>
            `https://loremflickr.com/640/480/city?lock=${Math.floor(Math.random() * 100000)}`,
          fashion: () =>
            `https://loremflickr.com/640/480/fashion?lock=${Math.floor(Math.random() * 100000)}`,
          food: () =>
            `https://loremflickr.com/640/480/food?lock=${Math.floor(Math.random() * 100000)}`,
          nature: () =>
            `https://loremflickr.com/640/480/nature?lock=${Math.floor(Math.random() * 100000)}`,
          technics: () =>
            `https://loremflickr.com/640/480/technics?lock=${Math.floor(Math.random() * 100000)}`,
          transport: () =>
            `https://loremflickr.com/640/480/transport?lock=${Math.floor(Math.random() * 100000)}`,
          abstract: () =>
            `https://loremflickr.com/640/480/abstract?lock=${Math.floor(Math.random() * 100000)}`,
          people: () =>
            `https://loremflickr.com/640/480/people?lock=${Math.floor(Math.random() * 100000)}`,
          nightlife: () =>
            `https://loremflickr.com/640/480/nightlife?lock=${Math.floor(Math.random() * 100000)}`,
          urlSquare: () =>
            `https://picsum.photos/200/200?random=${Math.floor(Math.random() * 100000)}`,
          urlThumbnail: () =>
            `https://picsum.photos/150/150?random=${Math.floor(Math.random() * 100000)}`,
          urlHD: () =>
            `https://picsum.photos/1280/720?random=${Math.floor(Math.random() * 100000)}`,
          urlFullHD: () =>
            `https://picsum.photos/1920/1080?random=${Math.floor(Math.random() * 100000)}`,
        },
        {
          get(target, prop) {
            if (
              typeof prop === "string" &&
              prop.startsWith("customCategory:")
            ) {
              const category = prop.slice("customCategory:".length) || "random";
              return () =>
                `https://loremflickr.com/640/480/${category}?lock=${Math.floor(Math.random() * 100000)}`;
            }
            if (prop === "customCategory") {
              return () =>
                `https://loremflickr.com/640/480/random?lock=${Math.floor(Math.random() * 100000)}`;
            }
            return Reflect.get(target, prop);
          },
        },
      ),
    };

    const result = await generate(
      transformedSchema as Parameters<typeof generate>[0],
      {
        alwaysFakeOptionals: true,
        useDefaultValue: true,
        minItems,
        maxItems,
        extensions: {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          faker: extendedFaker as any,
        },
      },
    );
    mockTrace.traceSuccess("generatePayload", "Generated successfully");
    return result;
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
  const result = Math.random() * 100 < errorRate;
  mockTrace.traceSuccess("shouldError", result);
  return result;
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

  const res = new Response(JSON.stringify(payload, null, 2), {
    status: statusCode,
    headers,
  });
  mockTrace.traceSuccess("buildResponse", `Response created: ${statusCode}`);
  return res;
}

export function buildCorsPreflightResponse(): Response {
  mockTrace.traceCall("buildCorsPreflightResponse");
  const res = new Response(null, {
    status: 204,
    headers: new Headers(CORS_HEADERS),
  });
  mockTrace.traceSuccess("buildCorsPreflightResponse", "204 preflight created");
  return res;
}

export function buildErrorResponse(
  statusCode: number = 500,
  message: string = "Internal Server Error",
): Response {
  mockTrace.traceCall("buildErrorResponse", statusCode, message);
  const res = buildResponse(
    {
      error: true,
      statusCode,
      message,
      timestamp: new Date().toISOString(),
    },
    statusCode,
  );
  mockTrace.traceSuccess("buildErrorResponse", `Error response: ${statusCode}`);
  return res;
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

    let result = [...items];

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

      result = result.filter((item) => {
        if (item && typeof item === "object") {
          const itemObj = item as Record<string, unknown>;
          if (key in itemObj) {
            const itemVal = itemObj[key];
            if (itemVal === undefined || itemVal === null) return false;
            return itemVal.toString().toLowerCase() === value.toLowerCase();
          }
        }
        return true;
      });
    }

    // 2. Global search
    const query = searchParams.get("q");
    if (query) {
      const lowerQuery = query.toLowerCase();
      result = result.filter((item) => {
        if (!item || typeof item !== "object") return false;
        return Object.values(item as Record<string, unknown>).some(
          (val) =>
            val !== null &&
            val !== undefined &&
            val.toString().toLowerCase().includes(lowerQuery),
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
      result.sort((a, b) => {
        const valA =
          a && typeof a === "object"
            ? (a as Record<string, unknown>)[sortBy]
            : undefined;
        const valB =
          b && typeof b === "object"
            ? (b as Record<string, unknown>)[sortBy]
            : undefined;

        if (valA === undefined || valA === null) return 1;
        if (valB === undefined || valB === null) return -1;

        if (typeof valA === "number" && typeof valB === "number") {
          return order === "desc" ? valB - valA : valA - valB;
        }

        const strA = valA.toString().toLowerCase();
        const strB = valB.toString().toLowerCase();
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
        result = result.slice(startIndex, endIndex);
      }
    } else if (pageParam) {
      const page = parseInt(pageParam, 10);
      if (!isNaN(page) && page > 0) {
        const startIndex = (page - 1) * 10;
        const endIndex = page * 10;
        result = result.slice(startIndex, endIndex);
      }
    }

    return result;
  };

  if (Array.isArray(payload)) {
    const res = processArray(payload);
    mockTrace.traceSuccess(
      "processQueryParameters (array)",
      `${res.length} items`,
    );
    return res;
  }

  if (typeof payload === "object" && payload !== null) {
    const result: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(
      payload as Record<string, unknown>,
    )) {
      if (Array.isArray(value)) {
        result[key] = processArray(value);
      } else {
        result[key] = value;
      }
    }
    mockTrace.traceSuccess(
      "processQueryParameters (object)",
      "processed array properties",
    );
    return result;
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
  params: Record<string, string>,
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

      if (rule.type === "query") {
        incomingValue = request.nextUrl.searchParams.get(rule.key);
      } else if (rule.type === "header") {
        incomingValue = request.headers.get(rule.key);
      } else if (rule.type === "param") {
        incomingValue = params[rule.key] || null;
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

// Helpers for internal unexposed functions
function logCallInternal(fnName: string, ...args: unknown[]) {
  mockTrace.traceCall(fnName, ...args);
}
function logSuccessInternal(fnName: string, result: unknown) {
  mockTrace.traceSuccess(fnName, result);
}
