/* oxlint-disable @typescript-eslint/no-explicit-any */
/* oxlint-disable @typescript-eslint/no-unused-vars */
/* oxlint-disable @typescript-eslint/no-unsafe-function-type */
import { faker } from "@faker-js/faker";

function get(obj: any, path: string): any {
  return path.split(".").reduce((acc, part) => acc && acc[part], obj);
}

/**
 * A tiny Handlebars-lite engine for Fack API response templating.
 * Supports:
 * - {{faker.person.firstName}}
 * - {{request.body.userId}}
 * - {{request.query.page}}
 * - {{request.params.id}}
 */
export function renderTemplate(
  template: string,
  context: {
    request: {
      body: any;
      query: Record<string, any>;
      params: Record<string, any>;
    };
  },
): any {
  // First, do a pass to evaluate all string interpolations.
  const rendered = template.replace(/{{([\w.]+)}}/g, (match, path) => {
    if (path.startsWith("faker.")) {
      try {
        const fakerPath = path.replace("faker.", "");
        const fakerFn = get(faker, fakerPath) as Function;
        if (typeof fakerFn === "function") {
          return fakerFn().toString();
        }
      } catch (e) {
        return match;
      }
    }

    if (path.startsWith("request.")) {
      const resolvedValue = get(context, path);
      return resolvedValue !== undefined ? String(resolvedValue) : match;
    }

    return match;
  });

  // Try to parse the rendered string as JSON if it looks like an object/array
  try {
    if (rendered.trim().startsWith("{") || rendered.trim().startsWith("[")) {
      return JSON.parse(rendered);
    }
  } catch (e) {
    // If it fails to parse, return the string.
  }

  return rendered;
}
