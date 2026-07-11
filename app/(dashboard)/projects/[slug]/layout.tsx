import * as React from "react";
import { notFound } from "next/navigation";
import { getProjectBySlug } from "@/lib/actions/projects";

interface ProjectLayoutProps {
  children: React.ReactNode;
  params: Promise<{ slug: string }>;
}

/**
 * Project Details Shell.
 * Resolves the target project from SQLite by slug.
 * Displays the project name and maps tabs to subroutes: Canvas, Endpoints, Settings.
 */
export default async function ProjectLayout({
  children,
  params,
}: ProjectLayoutProps) {
  const { slug } = await params;
  const project = await getProjectBySlug(slug);

  if (!project) {
    notFound();
  }

  return <div className="flex h-full w-full flex-col">{children}</div>;
}
