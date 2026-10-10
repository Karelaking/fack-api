import { beforeEach, describe, expect, it } from "vite-plus/test";
import type { Project } from "@/db/schema";
import { clearCache, setCachedProjectBySlug } from "@/lib/cache";
import { resolveProjectFromSlug } from "@/lib/services/project-resolver.service";

describe("Project resolver", () => {
  const project: Project = {
    id: "project-1",
    userId: "user-1",
    name: "Nested project",
    slug: "team/api",
    description: "",
    createdAt: new Date(),
    updatedAt: new Date(),
    isLoggingEnabled: false,
    isCachingEnabled: true,
    version: 1,
    activeScenarioId: null,
  };

  beforeEach(() => {
    clearCache();
  });

  it("resolves the longest cached namespace and preserves the request path", async () => {
    setCachedProjectBySlug(project.slug, project);

    await expect(
      resolveProjectFromSlug(["team", "api", "users", "42"]),
    ).resolves.toEqual({
      project,
      matchedSlug: "team/api",
      requestPath: "/users/42",
    });
  });

  it("returns null when no namespace matches", async () => {
    await expect(
      resolveProjectFromSlug(["missing", "users"]),
    ).resolves.toBeNull();
  });
});
