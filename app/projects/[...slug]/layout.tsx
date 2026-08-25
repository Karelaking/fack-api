import * as React from "react";
import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { getProjectBySlug, getProjects } from "@/lib/actions/projects";
import { parseProjectPath } from "@/lib/utils/project-slug";
import { ProjectProvider } from "@/components/project/ProjectContext";
import { Separator } from "@/components/ui/separator";
import { DashboardBreadcrumbs } from "@/components/dashboard/DashboardBreadcrumbs";
import { DashboardSidebar } from "@/components/dashboard/DashboardSidebar";
import { HeaderNewProjectButton } from "@/components/dashboard/HeaderNewProjectButton";
import { MobileBottomNav } from "@/components/dashboard/MobileBottomNav";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { CommandMenu } from "@/components/command-menu";

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
 * 4. Wraps children in a ProjectProvider and Dashboard layout.
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

  const [project, projects] = await Promise.all([
    getProjectBySlug(projectSlug),
    getProjects(),
  ]);

  if (!project) {
    notFound();
  }

  // Redirect bare project URL to the canvas subpage
  if (!subpage) {
    redirect(`/projects/${projectSlug}/canvas`);
  }

  return (
    <SidebarProvider>
      <div className="bg-background flex h-screen w-full max-w-full overflow-hidden">
        {/* Sidebar component */}
        <DashboardSidebar initialProjects={projects} />

        {/* Main Content Area */}
        <main className="relative flex min-w-0 flex-1 flex-col overflow-hidden">
          <header className="border-border bg-card flex h-14 shrink-0 items-center justify-between border-b px-4">
            <div className="flex items-center gap-2">
              <SidebarTrigger className="h-9 w-9" />
              <Separator orientation="vertical" className="h-4" />
              <DashboardBreadcrumbs projects={projects} />
            </div>
            <HeaderNewProjectButton />
          </header>
          <div className="bg-background flex-1 overflow-auto pb-14 md:pb-0">
            <ProjectProvider project={project}>{children}</ProjectProvider>
          </div>
          <MobileBottomNav />
        </main>
      </div>
      <CommandMenu />
    </SidebarProvider>
  );
}
