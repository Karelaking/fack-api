/**
 * Fack AI API Architect — Project Domain Service
 *
 * Provides database abstraction and transactional queries for projects,
 * shielding the AI agent from direct SQL execution.
 */

import { db } from "@/db";
import { projects, type Project, type Endpoint, type Route } from "@/db/schema";
import { eq } from "drizzle-orm";

export interface ProjectWithHierarchy extends Project {
  endpoints: (Endpoint & {
    routes: Route[];
  })[];
}

export interface ProjectSummary {
  id: string;
  name: string;
  slug: string;
  description: string;
  endpointCount: number;
  routeCount: number;
  endpoints: Array<{
    id: string;
    name: string;
    basePath: string;
    routeCount: number;
  }>;
}

/**
 * Finds a project by its unique ID.
 */
export async function findProjectById(
  projectId: string,
): Promise<ProjectWithHierarchy | undefined> {
  const project = await db.query.projects.findFirst({
    where: eq(projects.id, projectId),
    with: {
      endpoints: {
        with: {
          routes: true,
        },
      },
    },
  });

  return project;
}

/**
 * Finds a project by its URL slug.
 */
export async function findProjectBySlug(
  slug: string,
): Promise<ProjectWithHierarchy | undefined> {
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

  return project;
}

/**
 * Retrieves a lightweight structural summary of the project for AI context.
 */
export async function getProjectSummary(
  projectId: string,
): Promise<ProjectSummary | undefined> {
  const project = await findProjectById(projectId);
  if (!project) {
    return undefined;
  }

  let totalRoutes = 0;
  const endpointSummaries = project.endpoints.map((ep) => {
    totalRoutes += ep.routes.length;
    return {
      id: ep.id,
      name: ep.name,
      basePath: ep.basePath,
      routeCount: ep.routes.length,
    };
  });

  return {
    id: project.id,
    name: project.name,
    slug: project.slug,
    description: project.description ?? "",
    endpointCount: project.endpoints.length,
    routeCount: totalRoutes,
    endpoints: endpointSummaries,
  };
}
