"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Network, Activity, Settings2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface PageTabsProps {
  slug: string;
}

/**
 * Interactive navigation tabs linking to sub-sections of a project workspace.
 */
export function PageTabs({ slug }: PageTabsProps) {
  const pathname = usePathname();

  const tabs = [
    {
      name: "Canvas",
      href: `/projects/${slug}/canvas`,
      icon: Network,
    },
    {
      name: "Endpoints",
      href: `/projects/${slug}/endpoints`,
      icon: Activity,
    },
    {
      name: "Settings",
      href: `/projects/${slug}/settings`,
      icon: Settings2,
    },
  ];

  return (
    <div className="border-b border-border">
      <nav className="flex space-x-2" aria-label="Tabs">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = pathname.startsWith(tab.href);

          return (
            <Link
              key={tab.name}
              href={tab.href as Parameters<typeof Link>[0]["href"]}
              className={cn(
                "flex items-center gap-2 px-4 py-2 text-sm font-semibold border-b-2 transition-all hover:text-foreground",
                isActive
                  ? "border-primary text-foreground"
                  : "border-transparent text-muted-foreground"
              )}
            >
              <Icon className="h-4 w-4" />
              <span>{tab.name}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
