"use server";

import { db } from "@/db";
import { projects } from "@/db/schema";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { generateId, slugify } from "@/lib/utils";
import {
  createProjectSchema,
  updateProjectSchema,
  type CreateProjectInput,
  type UpdateProjectInput,
} from "@/lib/validators";

export async function getProjects() {
  return db.query.projects.findMany({
    orderBy: (projects, { desc }) => [desc(projects.updatedAt)],
  });
}

export async function getProjectBySlug(slug: string) {
  return db.query.projects.findFirst({
    where: eq(projects.slug, slug),
    with: {
      endpoints: {
        with: {
          routes: true,
        },
      },
    },
  });
}

export async function getProjectById(id: string) {
  return db.query.projects.findFirst({
    where: eq(projects.id, id),
  });
}

export async function createProject(input: CreateProjectInput) {
  const parsed = createProjectSchema.parse(input);
  const id = generateId();
  const slug = parsed.slug ? slugify(parsed.slug) : slugify(parsed.name);

  // Ensure slug uniqueness by appending a short suffix if needed
  const existing = await db.query.projects.findFirst({
    where: eq(projects.slug, slug),
  });
  const finalSlug = existing ? `${slug}-${generateId(4)}` : slug;

  const [project] = await db
    .insert(projects)
    .values({
      id,
      name: parsed.name,
      slug: finalSlug,
      description: parsed.description ?? "",
    })
    .returning();

  revalidatePath("/");
  return project;
}

export async function updateProject(input: UpdateProjectInput) {
  const parsed = updateProjectSchema.parse(input);
  const { id, ...updates } = parsed;

  const [project] = await db
    .update(projects)
    .set({ ...updates, updatedAt: new Date() })
    .where(eq(projects.id, id))
    .returning();

  revalidatePath("/");
  return project;
}

export async function deleteProject(id: string) {
  await db.delete(projects).where(eq(projects.id, id));
  revalidatePath("/");
}
