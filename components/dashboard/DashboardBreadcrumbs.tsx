"use client";

import * as React from "react";
import type { Route } from "next";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  RiArrowRightSLine,
  RiArrowUpDownLine,
  RiGitBranchLine,
  RiPulseLine,
  RiSettings2Line,
  RiFileHistoryLine,
} from "@remixicon/react";
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
export function DashboardBreadcrumbs({
  projects = [],
}: DashboardBreadcrumbsProps): React.JSX.Element {
  const pathname = usePathname();
  const router = useRouter();
  const projectsList = projects;

  const segments = pathname.split("/").filter(Boolean);

  if (segments.length === 0) {
    return (
      <div className="text-muted-foreground flex items-center gap-1.5 text-sm font-medium select-none">
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
      <nav className="text-muted-foreground flex items-center gap-1.5 text-sm font-medium select-none">
        {breadcrumbs.map((crumb, idx) => {
          const isLast = idx === breadcrumbs.length - 1;
          const isFirst = idx === 0;
          const isPrevFirst = idx === 1;

          return (
            <React.Fragment key={`${crumb.href}-${idx}`}>
              {idx > 0 && (
                <RiArrowRightSLine
                  className={cn(
                    "text-muted-foreground/45 h-3.5 w-3.5 shrink-0",
                    isPrevFirst && "hidden sm:inline",
                  )}
                />
              )}
              <div className={cn(isFirst && "hidden sm:block")}>
                {isLast ? (
                  crumb.isProject && projectsList.length > 0 ? (
                    <DropdownMenu>
                      <DropdownMenuTrigger className="hover:text-foreground text-foreground group flex items-center gap-1 font-semibold transition-colors focus:outline-none">
                        <span className="max-w-37.5 truncate sm:max-w-xs">
                          {crumb.label}
                        </span>
                        <RiArrowUpDownLine className="text-muted-foreground/60 group-hover:text-foreground h-3.5 w-3.5 shrink-0 transition-colors" />
                      </DropdownMenuTrigger>
                      <DropdownMenuContent
                        align="start"
                        className="max-h-75 w-52 overflow-y-auto"
                      >
                        {projectsList.map((p) => {
                          const isActive = p.slug === projectSlug;
                          return (
                            <DropdownMenuItem
                              key={p.id}
                              className={`flex w-full cursor-pointer items-center justify-between py-1.5 text-sm ${
                                isActive
                                  ? "text-primary bg-accent/40 font-semibold"
                                  : ""
                              }`}
                              onClick={() =>
                                router.push(
                                  getProjectTabHref(p.slug, segments[2]),
                                )
                              }
                            >
                              <span className="truncate">{p.name}</span>
                              {isActive && (
                                <span className="bg-primary h-1.5 w-1.5 shrink-0 rounded-full" />
                              )}
                            </DropdownMenuItem>
                          );
                        })}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  ) : (
                    <span className="text-foreground max-w-37.5 truncate font-semibold sm:max-w-xs">
                      {crumb.label}
                    </span>
                  )
                ) : crumb.isProject && projectsList.length > 0 ? (
                  <DropdownMenu>
                    <DropdownMenuTrigger className="hover:text-foreground text-muted-foreground group flex items-center gap-1 font-normal transition-colors focus:outline-none">
                      <span className="max-w-37.5 truncate sm:max-w-xs">
                        {crumb.label}
                      </span>
                      <RiArrowUpDownLine className="text-muted-foreground/40 group-hover:text-foreground h-3 w-3 shrink-0 transition-colors" />
                    </DropdownMenuTrigger>
                    <DropdownMenuContent
                      align="start"
                      className="max-h-75 w-52 overflow-y-auto"
                    >
                      {projectsList.map((p) => {
                        const isActive = p.slug === projectSlug;
                        return (
                          <DropdownMenuItem
                            key={p.id}
                            className={`flex w-full cursor-pointer items-center justify-between py-1.5 text-sm ${
                              isActive
                                ? "text-primary bg-accent/40 font-semibold"
                                : ""
                            }`}
                            onClick={() =>
                              router.push(
                                getProjectTabHref(p.slug, segments[2]),
                              )
                            }
                          >
                            <span className="truncate">{p.name}</span>
                            {isActive && (
                              <span className="bg-primary h-1.5 w-1.5 shrink-0 rounded-full" />
                            )}
                          </DropdownMenuItem>
                        );
                      })}
                    </DropdownMenuContent>
                  </DropdownMenu>
                ) : (
                  <Link
                    href={crumb.href}
                    className="hover:text-foreground max-w-30 truncate font-normal transition-colors sm:max-w-xs"
                  >
                    {crumb.label}
                  </Link>
                )}
              </div>
            </React.Fragment>
          );
        })}
      </nav>

      {isProjectPage && (
        <div className="hidden items-center gap-3 md:flex">
          <div className="bg-border h-4 w-px shrink-0" />
          <nav
            className="bg-muted/65 border-border/40 flex items-center gap-0.5 rounded-lg border p-0.5"
            aria-label="Tabs"
          >
            {[
              {
                name: "Canvas",
                href: `/projects/${projectSlug}/canvas`,
                icon: RiGitBranchLine,
              },
              {
                name: "Endpoints",
                href: `/projects/${projectSlug}/endpoints`,
                icon: RiPulseLine,
              },
              {
                name: "Logs",
                href: `/projects/${projectSlug}/logs`,
                icon: RiFileHistoryLine,
              },
              {
                name: "Settings",
                href: `/projects/${projectSlug}/settings`,
                icon: RiSettings2Line,
              },
            ].map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.name.toLowerCase();
              return (
                <Link
                  key={tab.name}
                  href={tab.href as Parameters<typeof Link>[0]["href"]}
                  className={cn(
                    "flex items-center gap-1 rounded-md px-2 py-1 text-xs font-semibold transition-all select-none sm:gap-1.5 sm:px-3",
                    isActive
                      ? "bg-background text-foreground border-border/30 border shadow-xs"
                      : "text-muted-foreground hover:text-foreground border border-transparent",
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
