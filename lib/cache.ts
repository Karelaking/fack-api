import type { Project } from "@/db/schema";

// Singletons for in-memory cache
const projectListCache = new Map<string, any[]>();
const projectBySlugCache = new Map<string, Project>();
const projectByDomainCache = new Map<string, Project>();
const projectRoutesCache = new Map<string, any[]>();

export function getCachedProjectsList(): any[] | undefined {
  return projectListCache.get("all_projects");
}

export function setCachedProjectsList(projects: any[]) {
  projectListCache.set("all_projects", projects);
}

export function getCachedProjectBySlug(slug: string): Project | undefined {
  return projectBySlugCache.get(slug);
}

export function setCachedProjectBySlug(slug: string, project: Project) {
  projectBySlugCache.set(slug, project);
}

export function getCachedProjectByDomain(domain: string): Project | undefined {
  return projectByDomainCache.get(domain);
}

export function setCachedProjectByDomain(domain: string, project: Project) {
  projectByDomainCache.set(domain, project);
}

export function getCachedRoutes(projectId: string): any[] | undefined {
  return projectRoutesCache.get(projectId);
}

export function setCachedRoutes(projectId: string, routes: any[]) {
  projectRoutesCache.set(projectId, routes);
}

export function clearCache() {
  projectListCache.clear();
  projectBySlugCache.clear();
  projectByDomainCache.clear();
  projectRoutesCache.clear();
}
