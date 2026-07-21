import type { Project, Route } from "@/db/schema";

// Singletons for in-memory cache
const projectListCache = new Map<string, Project[]>();
const projectBySlugCache = new Map<string, Project>();
const projectByDomainCache = new Map<string, Project>();
const projectRoutesCache = new Map<string, Route[]>();

export function getCachedProjectsList(): Project[] | undefined {
  return projectListCache.get("all_projects");
}

export function setCachedProjectsList(projects: Project[]) {
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

export function getCachedRoutes(projectId: string): Route[] | undefined {
  return projectRoutesCache.get(projectId);
}

export function setCachedRoutes(projectId: string, routes: Route[]) {
  projectRoutesCache.set(projectId, routes);
}

export function clearCache() {
  projectListCache.clear();
  projectBySlugCache.clear();
  projectByDomainCache.clear();
  projectRoutesCache.clear();
}
