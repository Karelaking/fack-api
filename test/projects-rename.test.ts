import { describe, expect, it, vi } from "vite-plus/test";

// The rename/lookup actions call revalidatePath, which requires a Next.js
// request scope; stub it so the actions can run under Vitest.
vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
  revalidateTag: vi.fn(),
  unstable_cache: (fn: unknown) => fn,
}));

import { createProject, updateProject } from "../lib/actions/projects";
import {
  clearCache,
  getCachedProjectBySlug,
  setCachedProjectBySlug,
} from "../lib/cache";

describe("updateProject slug rename", () => {
  it("evicts the previous slug from the project-by-slug cache", async () => {
    clearCache();

    const project = await createProject({
      name: "Rename Me",
      slug: "rename-me",
    });

    // Simulate the read path populating the slug cache.
    setCachedProjectBySlug("rename-me", project);
    expect(getCachedProjectBySlug("rename-me")).toBeDefined();

    await updateProject({
      id: project.id,
      name: "Renamed",
      slug: "renamed-ok",
    });

    // The old slug must no longer resolve to the renamed project.
    expect(getCachedProjectBySlug("rename-me")).toBeUndefined();

    // Cleanup so other tests are unaffected.
    clearCache();
  });
});
