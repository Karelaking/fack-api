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
    <div className="h-full w-full flex flex-col">
      {children}
    </div>
  );
}
