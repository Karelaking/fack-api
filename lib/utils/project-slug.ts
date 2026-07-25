/**
 * Shared utility for parsing multi-segment project slugs from the catch-all route.
 *
 * Given a URL like `/projects/api/v1/canvas`, the `[...slug]` param yields
 * `["api", "v1", "canvas"]`. This utility separates the project slug from the
 * subpage identifier.
 */

export const PROJECT_SUBPAGES = [
  "canvas",
  "endpoints",
  "logs",
  "settings",
] as const;

export type ProjectSubpage = (typeof PROJECT_SUBPAGES)[number];

const subpageSet = new Set<string>(PROJECT_SUBPAGES);

export interface ParsedProjectPath {
  /** The reconstructed project slug (e.g. "api/v1") */
  projectSlug: string;
  /** The active subpage, or empty string if none matched */
  subpage: ProjectSubpage | "";
}

/**
 * Parses the catch-all slug segments into a project slug and subpage.
 *
 * @example
 * parseProjectPath(["api", "v1", "canvas"]) → { projectSlug: "api/v1", subpage: "canvas" }
 * parseProjectPath(["demo"])                → { projectSlug: "demo",   subpage: "" }
 * parseProjectPath(["demo", "settings"])    → { projectSlug: "demo",   subpage: "settings" }
 */
export function parseProjectPath(slugSegments: string[]): ParsedProjectPath {
  if (!slugSegments || slugSegments.length === 0) {
    return { projectSlug: "", subpage: "" };
  }

  const lastSegment = slugSegments[slugSegments.length - 1];

  if (subpageSet.has(lastSegment)) {
    return {
      projectSlug: slugSegments.slice(0, -1).join("/"),
      subpage: lastSegment as ProjectSubpage,
    };
  }

  return {
    projectSlug: slugSegments.join("/"),
    subpage: "",
  };
}
