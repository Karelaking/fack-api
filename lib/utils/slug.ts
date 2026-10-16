/**
 * Converts a human-readable string into a URL-safe slug.
 * Used for generating project slugs from project names.
 *
 * Processing steps:
 * 1. Convert to lowercase
 * 2. Trim whitespace
 * 3. Replace spaces with hyphens
 * 4. Remove non-word characters (except hyphens)
 * 5. Collapse consecutive hyphens
 * 6. Remove leading/trailing hyphens
 *
 * @param text - The input string to slugify
 * @returns A URL-safe slug string
 *
 * @example
 * ```ts
 * slugify("My Cool Project!")  // → "my-cool-project"
 * slugify("  API v2.0  ")      // → "api-v20"
 * ```
 */
export function slugify(text: string): string {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "-")
    .replace(/[^\w-]+/g, "")
    .replace(/--+/g, "-")
    .replace(/^-+/, "")
    .replace(/-+$/, "");
}

/**
 * Sanitizes input string to form a valid multi-segment project namespace path.
 * Retains slashes to support nested workspaces (e.g. "api/v1/auth").
 *
 * @param input - The raw text input
 * @returns Sanitized namespace path slug
 */
export function slugifyPath(input: string): string {
  return input
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^\w-/]/g, "")
    .replace(/\/+/g, "/");
}
