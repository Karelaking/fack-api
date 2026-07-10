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
        
        <Link
          href={`/projects/${project.slug}/settings`}
          className="hidden md:flex items-center gap-1.5 font-mono text-[10px] bg-muted hover:bg-accent px-2.5 py-1 rounded border border-border transition-all mr-1.5 group cursor-pointer"
          title="Click to change namespace settings"
        >
          <span className="text-muted-foreground font-sans group-hover:text-foreground">Namespace:</span>
          <span className="font-semibold text-foreground group-hover:text-primary">/mock/{project.slug}</span>
        </Link>
      </div>

      {/* Render children subpages */}
      <div className="flex-1 min-h-0 min-w-0">{children}</div>
    </div>
  );
}
