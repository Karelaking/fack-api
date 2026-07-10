"use client";

import * as React from "react";
import type { Route } from "next";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { ChevronRight, ChevronsUpDown } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface ProjectItem {
  id: string;
  name: string;
  slug: string;
}

interface DashboardBreadcrumbsProps {
  projects?: ProjectItem[];
}

type ProjectTab = "canvas" | "endpoints" | "settings";
type BreadcrumbItem = {
  label: string;
  href: Route;
  isProject: boolean;
};

function normalizeTab(tab: string | undefined): ProjectTab {
  if (tab === "endpoints" || tab === "settings") {
    return tab;
  }

  return "canvas";
}

function getProjectTabHref(slug: string, tab: string | undefined): Route {
  const normalizedTab = normalizeTab(tab);
  return `/projects/${slug}/${normalizedTab}` as Route;
}

/**
 * Client breadcrumb navigation component with project switching dropdown.
 * Parses the active router pathname and enables project switching.
 */
export function DashboardBreadcrumbs({ projects = [] }: DashboardBreadcrumbsProps) {
  const pathname = usePathname();
  const router = useRouter();
  const projectsList = projects;

  const segments = pathname.split("/").filter(Boolean);

  if (segments.length === 0) {
    return (
      <div className="flex items-center gap-1.5 text-sm font-medium text-muted-foreground select-none">
        <span>Workspaces</span>
      </div>
    );
  }

  const breadcrumbs: BreadcrumbItem[] = [];

  // Base "Workspaces" breadcrumb
  breadcrumbs.push({
    label: "Workspaces",
    href: "/dashboard",
    isProject: false,
  });

  const projectSlug = segments[0] === "projects" ? segments[1] : "";

  // Check if we are inside a project path: /projects/[slug]/[tab]
  if (segments[0] === "projects" && segments[1]) {
    const activeProject = projectsList.find((p) => p.slug === projectSlug);
    // Use the fetched project name or capitalize slug as fallback
    const projectLabel = activeProject
      ? activeProject.name
      : projectSlug
          .split("-")
          .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
          .join(" ");

    breadcrumbs.push({
      label: projectLabel,
      href: getProjectTabHref(projectSlug, "canvas"),
      isProject: true,
    });

    if (segments[2]) {
      const activeTab = normalizeTab(segments[2]);
      const capitalizedTab = activeTab.charAt(0).toUpperCase() + activeTab.slice(1);
      breadcrumbs.push({
        label: capitalizedTab,
        href: getProjectTabHref(projectSlug, activeTab),
        isProject: false,
      });
    }
  }

  return (
    <nav className="flex items-center gap-1.5 text-sm font-medium text-muted-foreground select-none">
      {breadcrumbs.map((crumb, idx) => {
        const isLast = idx === breadcrumbs.length - 1;

        return (
          <React.Fragment key={`${crumb.href}-${idx}`}>
            {idx > 0 && <ChevronRight className="h-3.5 w-3.5 text-muted-foreground/45 shrink-0" />}
            {isLast ? (
              crumb.isProject && projectsList.length > 0 ? (
                <DropdownMenu>
                  <DropdownMenuTrigger className="flex items-center gap-1 hover:text-foreground transition-colors font-semibold text-foreground focus:outline-none group">
                    <span className="truncate max-w-[150px] sm:max-w-xs">{crumb.label}</span>
                    <ChevronsUpDown className="h-3.5 w-3.5 text-muted-foreground/60 group-hover:text-foreground transition-colors shrink-0" />
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start" className="w-52 max-h-[300px] overflow-y-auto">
                    {projectsList.map((p) => {
                      const isActive = p.slug === projectSlug;
                      return (
                        <DropdownMenuItem
                          key={p.id}
                          className={`w-full flex items-center justify-between cursor-pointer text-sm py-1.5 ${
                            isActive ? "font-semibold text-primary bg-accent/40" : ""
                          }`}
                          onClick={() => router.push(getProjectTabHref(p.slug, segments[2]))}
                        >
                          <span className="truncate">{p.name}</span>
                          {isActive && <span className="h-1.5 w-1.5 rounded-full bg-primary shrink-0" />}
                        </DropdownMenuItem>
                      );
                    })}
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : (
                <span className="text-foreground font-semibold truncate max-w-[150px] sm:max-w-xs">
                  {crumb.label}
                </span>
              )
            ) : crumb.isProject && projectsList.length > 0 ? (
              <DropdownMenu>
                <DropdownMenuTrigger className="flex items-center gap-1 hover:text-foreground transition-colors font-normal text-muted-foreground focus:outline-none group">
                  <span className="truncate max-w-[150px]">{crumb.label}</span>
                  <ChevronsUpDown className="h-3 w-3 text-muted-foreground/40 group-hover:text-foreground transition-colors shrink-0" />
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="w-52 max-h-[300px] overflow-y-auto">
                  {projectsList.map((p) => {
                    const isActive = p.slug === projectSlug;
                    return (
                      <DropdownMenuItem
                        key={p.id}
                        className={`w-full flex items-center justify-between cursor-pointer text-sm py-1.5 ${
                          isActive ? "font-semibold text-primary bg-accent/40" : ""
                        }`}
                        onClick={() => router.push(getProjectTabHref(p.slug, segments[2]))}
                      >
                        <span className="truncate">{p.name}</span>
                        {isActive && <span className="h-1.5 w-1.5 rounded-full bg-primary shrink-0" />}
                      </DropdownMenuItem>
                    );
                  })}
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Link href={crumb.href} className="hover:text-foreground transition-colors truncate max-w-[120px] font-normal">
                {crumb.label}
              </Link>
            )}
          </React.Fragment>
        );
      })}
    </nav>
  );
}
