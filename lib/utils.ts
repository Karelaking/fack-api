/**
 * Fack API's — Shared Utility Functions
 *
 * This module provides common utility functions used across the application.
 * It includes the standard shadcn/ui `cn` helper and project-specific utilities
 * for ID generation, slug creation, and date formatting.
 */

import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { nanoid } from "nanoid";

/**
 * Merges Tailwind CSS classes with intelligent conflict resolution.
 * This is the standard utility function required by all shadcn/ui components.
 *
 * Uses `clsx` for conditional class joining and `tailwind-merge` to
 * resolve conflicting Tailwind utilities (e.g., `p-2` + `p-4` → `p-4`).
 *
 * @param inputs - Class values (strings, arrays, objects, conditionals)
 * @returns Merged, de-duplicated class string
 *
 * @example
 * ```ts
 * cn("px-4 py-2", isActive && "bg-primary", "px-6")
 * // → "py-2 px-6 bg-primary" (px-4 resolved to px-6)
 * ```
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

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
 * @param val - The raw text input
 * @returns Sanitized namespace path slug
 */
export function slugifyInput(val: string): string {
  return val
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^\w-/]/g, "")
    .replace(/\/+/g, "/");
}

/**
 * Formats a Date object into a human-readable relative time string.
 * Used in the dashboard to display "last modified" timestamps.
 *
 * Output examples:
 * - "just now" (< 60 seconds)
 * - "5m ago" (< 60 minutes)
 * - "3h ago" (< 24 hours)
 * - "2d ago" (< 7 days)
 * - "Jun 15" (same year)
 * - "Jun 15, 2024" (different year)
 *
 * @param date - The Date object to format
 * @returns A human-readable relative time string
 */
export function formatRelativeTime(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSeconds = Math.floor(diffMs / 1000);
  const diffMinutes = Math.floor(diffSeconds / 60);
  const diffHours = Math.floor(diffMinutes / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffSeconds < 60) return "just now";
  if (diffMinutes < 60) return `${diffMinutes}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;

  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: date.getFullYear() !== now.getFullYear() ? "numeric" : undefined,
  });
}
