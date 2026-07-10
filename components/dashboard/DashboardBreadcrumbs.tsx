"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronRight } from "lucide-react";

/**
 * Client breadcrumb navigation component.
 * Parses the active router pathname and builds a dynamic, responsive navigation trail.
 */
export function DashboardBreadcrumbs() {
  const pathname = usePathname();

  const segments = pathname.split("/").filter(Boolean);

  if (segments.length === 0) {
    return (
      <div className="flex items-center gap-1.5 text-sm font-medium text-muted-foreground select-none">
        <span>Workspaces</span>
      </div>
    );
  }

  const breadcrumbs = [];

  // Base "Workspaces" breadcrumb
  breadcrumbs.push({
    label: "Workspaces",
    href: "/",
  });

  // Check if we are inside a project path: /projects/[slug]/[tab]
  if (segments[0] === "projects" && segments[1]) {
    const projectSlug = segments[1];
    // Capitalize slug words for cleaner display (e.g. billing-service -> Billing Service)
    const formattedSlug = projectSlug
      .split("-")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");

    breadcrumbs.push({
      label: formattedSlug,
      href: `/projects/${projectSlug}/canvas`,
    });

    if (segments[2]) {
      const activeTab = segments[2];
      const capitalizedTab = activeTab.charAt(0).toUpperCase() + activeTab.slice(1);
      breadcrumbs.push({
        label: capitalizedTab,
        href: `/projects/${projectSlug}/${activeTab}`,
      });
    }
  }

  return (
    <nav className="flex items-center gap-1.5 text-sm font-medium text-muted-foreground select-none">
      {breadcrumbs.map((crumb, idx) => {
        const isLast = idx === breadcrumbs.length - 1;

        return (
          <React.Fragment key={crumb.href}>
            {idx > 0 && <ChevronRight className="h-3.5 w-3.5 text-muted-foreground/45 shrink-0" />}
            {isLast ? (
              <span className="text-foreground font-semibold truncate max-w-[150px] sm:max-w-xs">
                {crumb.label}
              </span>
            ) : (
              <Link
                href={crumb.href as any}
                className="hover:text-foreground transition-colors truncate max-w-[120px] font-normal"
              >
                {crumb.label}
              </Link>
            )}
          </React.Fragment>
        );
      })}
    </nav>
  );
}
