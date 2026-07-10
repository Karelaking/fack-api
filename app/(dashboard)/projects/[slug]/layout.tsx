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
    <div className="space-y-3.5 flex flex-col h-full w-full">
      {/* Workspace subtabs and Namespace badge on the same row */}
      <div className="flex items-center justify-between border-b border-border shrink-0 pb-1.5 gap-4">
        <PageTabs slug={project.slug} />
        
        <div className="hidden md:flex items-center gap-1.5 font-mono text-[10px] bg-muted px-2.5 py-1 rounded border border-border mr-1.5">
          <span className="text-muted-foreground font-sans">Namespace:</span>
          <span className="font-semibold text-foreground">/mock/{project.slug}</span>
        </div>
      </div>

      {/* Render children subpages */}
      <div className="flex-1 min-h-0 min-w-0">{children}</div>
    </div>
  );
}
