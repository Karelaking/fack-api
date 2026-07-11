"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { RiGitBranchLine, RiPulseLine, RiSettings2Line, RiFileHistoryLine } from "@remixicon/react";
import type { Route } from "next";
import { cn } from "@/lib/utils";

export function MobileBottomNav(): React.JSX.Element | null {
  const pathname = usePathname();
  const segments = pathname.split("/").filter(Boolean);
  const isProjectPage = segments[0] === "projects" && segments[1];

  if (!isProjectPage) return null;

  const projectSlug = segments[1];
  const activeTab = segments[2] || "canvas";

  const tabs = [
    {
      name: "Canvas",
      href: `/projects/${projectSlug}/canvas` as Route,
      icon: RiGitBranchLine,
    },
    {
      name: "Endpoints",
      href: `/projects/${projectSlug}/endpoints` as Route,
      icon: RiPulseLine,
    },
    {
      name: "Logs",
      href: `/projects/${projectSlug}/logs` as Route,
      icon: RiFileHistoryLine,
    },
    {
      name: "Settings",
      href: `/projects/${projectSlug}/settings` as Route,
      icon: RiSettings2Line,
    },
  ];

  return (
    <div className="bg-card/85 border-border fixed right-0 bottom-0 left-0 z-40 flex h-14 items-center justify-around border-t px-4 backdrop-blur-md select-none md:hidden">
      {tabs.map((tab) => {
        const Icon = tab.icon;
        const isActive = activeTab === tab.name.toLowerCase();

        return (
          <Link
            key={tab.name}
            href={tab.href}
            className={cn(
              "flex h-full flex-1 flex-col items-center justify-center gap-0.5 text-[10px] font-bold transition-colors",
              isActive
                ? "text-primary"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            <Icon className="h-5 w-5 shrink-0" />
            <span>{tab.name}</span>
          </Link>
        );
      })}
    </div>
  );
}
