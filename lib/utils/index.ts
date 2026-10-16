/**
 * Fack API's — Shared Utility Functions
 *
 * This barrel re-exports common utility functions used across the application,
 * including the standard shadcn/ui `cn` helper and project-specific utilities
 * for ID generation, slug creation, and date formatting.
 */

export { cn } from "cn";
export { generateId } from "./ids";
export { formatRelativeTime } from "./date";
export { slugify, slugifyPath } from "./slug";
