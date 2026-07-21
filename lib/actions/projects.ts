"use server";

import { db } from "@/db";
import { projects } from "@/db/schema";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { generateId, slugify } from "@/lib/utils";
import {
  getCachedProjectsList,
  setCachedProjectsList,
  getCachedProjectBySlug,
  setCachedProjectBySlug,
  clearCache,
} from "@/lib/cache";
import {
  createProjectSchema,
  updateProjectSchema,
  type CreateProjectInput,
  type UpdateProjectInput,
} from "@/lib/validators";
import { LoggerRegistry } from "@/lib/logger-registry";

const projectsTrace = LoggerRegistry.getTrace("db-projects");

export async function getProjects(): Promise<(typeof projects.$inferSelect)[]> {
  projectsTrace.traceCall("getProjects");
  const cached = getCachedProjectsList();
  if (cached) {
    projectsTrace.traceSuccess(
      "getProjects (cache hit)",
      `${cached.length} projects`,
    );
    return cached;
  }

  try {
    const list = await db.query.projects.findMany({
      orderBy: (projects, { desc }) => [desc(projects.updatedAt)],
      with: {
        endpoints: {
          with: {
            routes: true,
          },
        },
      },
    });
    setCachedProjectsList(list);
    projectsTrace.traceSuccess(
      "getProjects (DB fetched)",
      `${list.length} projects`,
    );
    return list;
  } catch (error) {
    const message = error instanceof Error ? error.message : "";
    if (message.includes("no such table: projects")) {
      console.warn(
        '[fack-api] Database schema is not initialized. Run "pnpm db:push" to create the required tables.',
      );
      projectsTrace.traceSuccess("getProjects (not initialized)", []);
      return [];
    }

    projectsTrace.traceError("getProjects", error);
    throw error;
  }
}

export async function getProjectBySlug(
  slug: string,
): Promise<typeof projects.$inferSelect | undefined> {
  projectsTrace.traceCall("getProjectBySlug", slug);
  const cached = getCachedProjectBySlug(slug);
  if (cached) {
    projectsTrace.traceSuccess("getProjectBySlug (cache hit)", cached.name);
    return cached;
  }

  try {
    const project = await db.query.projects.findFirst({
      where: eq(projects.slug, slug),
      with: {
        endpoints: {
          with: {
            routes: true,
          },
        },
      },
    });

    if (project) {
      setCachedProjectBySlug(slug, project);
    }
    projectsTrace.traceSuccess(
      "getProjectBySlug (DB fetched)",
      project ? project.name : "undefined",
    );
    return project;
  } catch (error) {
    projectsTrace.traceError("getProjectBySlug", error);
    throw error;
  }
}

export async function getProjectById(
  id: string,
): Promise<typeof projects.$inferSelect | undefined> {
  projectsTrace.traceCall("getProjectById", id);
  try {
    const project = await db.query.projects.findFirst({
      where: eq(projects.id, id),
    });
    projectsTrace.traceSuccess(
      "getProjectById",
      project ? project.name : "undefined",
    );
    return project;
  } catch (error) {
    projectsTrace.traceError("getProjectById", error);
    throw error;
  }
}

export async function createProject(
  input: CreateProjectInput,
): Promise<typeof projects.$inferSelect> {
  projectsTrace.traceCall("createProject", input.name, input.slug);
  try {
    const parsed = createProjectSchema.parse(input);
    const id = generateId();
    const slug = parsed.slug
      ? parsed.slug
          .split("/")
          .map((s) => slugify(s))
          .join("/")
      : slugify(parsed.name);

    // Ensure slug uniqueness by appending a short suffix if needed
    const existing = await db.query.projects.findFirst({
      where: eq(projects.slug, slug),
    });
    const finalSlug = existing ? `${slug}-${generateId(4)}` : slug;

    const hasLogsDb = !!process.env.LOGS_POSTGRES_URL;

    const [project] = await db
      .insert(projects)
      .values({
        id,
        name: parsed.name,
        slug: finalSlug,
        description: parsed.description ?? "",
        isLoggingEnabled: hasLogsDb,
        isCachingEnabled: parsed.isCachingEnabled ?? true,
      })
      .returning();

    clearCache();
    revalidatePath("/");
    projectsTrace.traceSuccess("createProject", project.name);
    return project;
  } catch (error) {
    projectsTrace.traceError("createProject", error);
    throw error;
  }
}

export async function updateProject(
  input: UpdateProjectInput,
): Promise<typeof projects.$inferSelect> {
  projectsTrace.traceCall("updateProject", input.id, input.name);
  try {
    const parsed = updateProjectSchema.parse(input);
    const { id, ...updates } = parsed;

    if (updates.slug) {
      updates.slug = updates.slug
        .split("/")
        .map((s) => slugify(s))
        .join("/");
    }

    const hasLogsDb = !!process.env.LOGS_POSTGRES_URL;
    if (!hasLogsDb) {
      updates.isLoggingEnabled = false;
    }

    const [project] = await db
      .update(projects)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(projects.id, id))
      .returning();

    clearCache();
    revalidatePath("/");
    projectsTrace.traceSuccess("updateProject", project.name);
    return project;
  } catch (error) {
    projectsTrace.traceError("updateProject", error);
    throw error;
  }
}

export async function deleteProject(id: string): Promise<void> {
  projectsTrace.traceCall("deleteProject", id);
  try {
    await db.delete(projects).where(eq(projects.id, id));
    clearCache();
    revalidatePath("/");
    projectsTrace.traceSuccess("deleteProject", "void");
  } catch (error) {
    projectsTrace.traceError("deleteProject", error);
    throw error;
  }
}
