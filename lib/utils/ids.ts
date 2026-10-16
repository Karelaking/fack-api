import { nanoid } from "nanoid";

/**
 * Generates a compact, URL-safe unique identifier using nanoid.
 * Used as primary keys across all database tables (projects, endpoints, routes).
 *
 * Default size of 12 characters provides ~36^12 possible IDs,
 * sufficient for single-instance applications.
 *
 * @param size - Length of the generated ID (default: 12)
 * @returns A URL-safe unique identifier string
 */
export function generateId(size = 12): string {
  return nanoid(size);
}
