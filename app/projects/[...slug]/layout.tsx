import * as React from "react";
import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { getProjectBySlug } from "@/lib/actions/projects";
import { parseProjectPath } from "@/lib/utils/project-slug";
import { ProjectProvider } from "@/components/project/ProjectContext";

interface ProjectLayoutProps {
  children: React.ReactNode;
  params: Promise<{ slug: string[] }>;
}

/**
 * Generates dynamic metadata so browser tabs show the project name.
 * e.g. "My API — Fack API's" instead of the static root title.
 */
export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string[] }>;
}): Promise<Metadata> {
  const { slug: slugParam } = await params;
  const { projectSlug } = parseProjectPath(slugParam);

  if (!projectSlug) {
    return { title: "Project — Fack API's" };
  }

  const project = await getProjectBySlug(projectSlug);
  return {
    title: project ? `${project.name} — Fack API's` : "Project — Fack API's",
  };
}

/**
 * Project-level layout.
 *
 * Responsibilities:
 * 1. Parses the multi-segment slug to extract the project identifier.
 * 2. Validates the project exists (calls notFound() if missing).
 * 3. Redirects bare `/projects/slug` → `/projects/slug/canvas`.
 * 4. Wraps children in a ProjectProvider so subpage components can
 *    access the project via `useProject()` without prop drilling.
 */
export default async function ProjectLayout({
  children,
  params,
}: ProjectLayoutProps) {
  const { slug: slugParam } = await params;

  if (!slugParam || slugParam.length === 0) {
    notFound();
  }

  const { projectSlug, subpage } = parseProjectPath(slugParam);

  if (!projectSlug) {
    notFound();
  }

  const project = await getProjectBySlug(projectSlug);

  if (!project) {
    notFound();
  }

  // Redirect bare project URL to the canvas subpage
  if (!subpage) {
    redirect(`/projects/${projectSlug}/canvas`);
  }

  return <ProjectProvider project={project}>{children}</ProjectProvider>;
}
