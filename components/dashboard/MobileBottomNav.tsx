"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Network, Activity, Settings2 } from "lucide-react";
import type { Route } from "next";
import { cn } from "@/lib/utils";

export function MobileBottomNav() {
  const pathname = usePathname();
  const segments = pathname.split("/").filter(Boolean);
  const isProjectPage = segments[0] === "projects" && segments[1];

  if (!isProjectPage) return null;

  const projectSlug = segments[1];
  const activeTab = segments[2] || "canvas";

  const tabs = [
    { name: "Canvas", href: `/projects/${projectSlug}/canvas` as Route, icon: Network },
    { name: "Endpoints", href: `/projects/${projectSlug}/endpoints` as Route, icon: Activity },
    { name: "Settings", href: `/projects/${projectSlug}/settings` as Route, icon: Settings2 },
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 md:hidden h-14 bg-card/85 backdrop-blur-md border-t border-border flex items-center justify-around px-4 select-none">
      {tabs.map((tab) => {
        const Icon = tab.icon;
        const isActive = activeTab === tab.name.toLowerCase();

        return (
          <Link
            key={tab.name}
            href={tab.href}
            className={cn(
              "flex flex-col items-center justify-center flex-1 h-full gap-0.5 text-[10px] font-bold transition-colors",
              isActive
                ? "text-primary"
                : "text-muted-foreground hover:text-foreground"
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
