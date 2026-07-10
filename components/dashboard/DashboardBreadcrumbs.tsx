"use client";

import * as React from "react";
import type { Route } from "next";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { ChevronRight, ChevronsUpDown, Network, Activity, Settings2 } from "lucide-react";
import { cn } from "@/lib/utils";
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
 * Client breadcrumb navigation component with project switching dropdown and top-bar sub-navigation.
 * Parses the active router pathname, enables project switching, and hosts workspace page tabs.
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
  const isProjectPage = segments[0] === "projects" && segments[1];
  const activeTab = segments[2] ? normalizeTab(segments[2]) : "canvas";

  // Check if we are inside a project path: /projects/[slug]/[tab]
  if (isProjectPage) {
    const activeProject = projectsList.find((p) => p.slug === projectSlug);
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
  }

  return (
    <div className="flex items-center gap-4">
      <nav className="flex items-center gap-1.5 text-sm font-medium text-muted-foreground select-none">
        {breadcrumbs.map((crumb, idx) => {
          const isLast = idx === breadcrumbs.length - 1;
          const isFirst = idx === 0;
          const isPrevFirst = idx === 1;

          return (
            <React.Fragment key={`${crumb.href}-${idx}`}>
              {idx > 0 && (
                <ChevronRight className={cn(
                  "h-3.5 w-3.5 text-muted-foreground/45 shrink-0",
                  isPrevFirst && "hidden sm:inline"
                )} />
              )}
              <div className={cn(isFirst && "hidden sm:block")}>
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
              </div>
            </React.Fragment>
          );
        })}
      </nav>

      {isProjectPage && (
        <div className="hidden md:flex items-center gap-3">
          <div className="h-4 w-px bg-border shrink-0" />
          <nav className="flex items-center gap-0.5 bg-muted/65 p-0.5 rounded-lg border border-border/40" aria-label="Tabs">
            {[
              { name: "Canvas", href: `/projects/${projectSlug}/canvas`, icon: Network },
              { name: "Endpoints", href: `/projects/${projectSlug}/endpoints`, icon: Activity },
              { name: "Settings", href: `/projects/${projectSlug}/settings`, icon: Settings2 },
            ].map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.name.toLowerCase();
              return (
                <Link
                  key={tab.name}
                  href={tab.href as Parameters<typeof Link>[0]["href"]}
                  className={cn(
                    "flex items-center gap-1 sm:gap-1.5 px-2 sm:px-3 py-1 text-xs font-semibold rounded-md transition-all select-none",
                    isActive
                      ? "bg-background text-foreground shadow-xs border border-border/30"
                      : "text-muted-foreground hover:text-foreground border border-transparent"
                  )}
                >
                  <Icon className="h-3.5 w-3.5 shrink-0" />
                  <span className="hidden sm:inline">{tab.name}</span>
                </Link>
              );
            })}
          </nav>
        </div>
      )}
    </div>
  );
}
