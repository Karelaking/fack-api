/**
 * Coercion helpers for values whose static type is broad or dynamic
 * (loosely-typed DB rows, parsed JSON bodies, mock payloads).
 *
 * Using `String(value)` / `value.toString()` directly on such values is
 * unsafe: objects stringify to "[object Object]". These helpers narrow the
 * type first and fall back to JSON for structured values.
 */

/** Coerce a loosely-typed value to a string without losing objects. */
export function toStr(value: unknown): string {
  if (value === null || value === undefined) return "";
  if (typeof value === "string") return value;
  if (
    typeof value === "number" ||
    typeof value === "bigint" ||
    typeof value === "boolean"
  ) {
    return String(value);
  }
  const json = JSON.stringify(value);
  return json === undefined ? "" : json;
}
