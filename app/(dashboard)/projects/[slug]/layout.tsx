import * as React from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getProjectBySlug } from "@/lib/actions/projects";
import { PageTabs } from "@/components/dashboard/PageTabs";

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

  return (
    <div className="space-y-6 flex flex-col h-full max-w-7xl mx-auto">
      {/* Title section */}
      <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between shrink-0">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{project.name}</h1>
          <p className="text-muted-foreground text-sm mt-0.5">
            {project.description || "No description provided."}
          </p>
        </div>
        <div className="flex items-center gap-2 font-mono text-xs bg-muted px-3 py-1.5 rounded-md border border-border">
          <span className="text-muted-foreground">Base Namespace:</span>
          <span className="font-semibold text-foreground">/mock/{project.slug}</span>
        </div>
      </div>

      {/* Workspace subtabs using our tabs helper */}
      <PageTabs slug={project.slug} />

      {/* Render children subpages */}
      <div className="flex-1 min-h-0 min-w-0">{children}</div>
    </div>
  );
}
