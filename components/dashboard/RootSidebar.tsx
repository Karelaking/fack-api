"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  RiLayoutGridLine,
  RiFileList3Line,
  RiBarChartBoxLine,
  RiEarthLine,
  RiKey2Line,
  RiSettings3Line,
  RiSearchLine,
  RiArrowUpDownLine,
  RiMoreFill,
  RiNotification3Line,
} from "@remixicon/react";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarSeparator,
} from "@/components/ui/sidebar";

const mainNavItems = [
  {
    title: "Projects",
    href: "/",
    icon: RiLayoutGridLine,
  },
  {
    title: "Activity Logs",
    href: "/activity",
    icon: RiFileList3Line,
  },
  {
    title: "Analytics",
    href: "/analytics",
    icon: RiBarChartBoxLine,
  },
];

const configNavItems = [
  {
    title: "Custom Domains",
    href: "/domains",
    icon: RiEarthLine,
  },
  {
    title: "API Keys",
    href: "/keys",
    icon: RiKey2Line,
  },
  {
    title: "Settings",
    href: "/settings",
    icon: RiSettings3Line,
  },
];

export function RootSidebar(): React.JSX.Element {
  const pathname = usePathname();

  return (
    <Sidebar variant="sidebar">
      <SidebarHeader>
        <div className="flex flex-col gap-4 px-2 pt-2">
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton size="lg">
                <div className="flex w-full min-w-0 items-center justify-between">
                  <div className="flex min-w-0 items-center gap-2">
                    <div className="bg-primary/20 text-primary flex h-6 w-6 shrink-0 items-center justify-center rounded-md text-xs font-semibold">
                      W
                    </div>
                    <span className="truncate text-sm font-medium">
                      Mradul Kumar&apos;s Workspace
                    </span>
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    <span className="bg-secondary text-secondary-foreground flex h-5 items-center justify-center rounded-sm px-1.5 text-[10px]">
                      Hobby
                    </span>
                    <RiArrowUpDownLine className="text-muted-foreground h-4 w-4 shrink-0" />
                  </div>
                </div>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>

          <div
            className="relative cursor-pointer px-2"
            onClick={() =>
              window.dispatchEvent(new CustomEvent("open-command-menu"))
            }
          >
            <RiSearchLine className="text-muted-foreground pointer-events-none absolute top-1/2 left-4 h-4 w-4 -translate-y-1/2" />
            <input
              type="text"
              readOnly
              placeholder="Find"
              className="border-border/40 bg-background text-foreground placeholder:text-muted-foreground focus:ring-primary pointer-events-none h-9 w-full cursor-pointer rounded-md border py-1 pr-8 pl-9 text-sm focus:ring-1 focus:outline-none"
            />
            <div className="border-border bg-muted/50 text-muted-foreground pointer-events-none absolute top-1/2 right-3.5 flex h-5 w-5 -translate-y-1/2 items-center justify-center rounded-[4px] border text-[10px] font-medium uppercase">
              F
            </div>
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent>
        <div className="flex flex-col gap-2 pt-4">
          <SidebarGroup>
            <SidebarGroupContent>
              <SidebarMenu>
                {mainNavItems.map((item) => {
                  const isActive =
                    pathname === item.href ||
                    (pathname.startsWith(item.href) && item.href !== "/");
                  return (
                    <SidebarMenuItem key={item.title}>
                      <SidebarMenuButton
                        isActive={isActive}
                        render={<Link href={item.href} />}
                      >
                        <item.icon className="h-4 w-4" />
                        <span>{item.title}</span>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  );
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>

          <div className="px-4">
            <SidebarSeparator />
          </div>

          <SidebarGroup>
            <SidebarGroupContent>
              <SidebarMenu>
                {configNavItems.map((item) => {
                  const isActive =
                    pathname === item.href || pathname.startsWith(item.href);
                  return (
                    <SidebarMenuItem key={item.title}>
                      <SidebarMenuButton
                        isActive={isActive}
                        render={<Link href={item.href} />}
                      >
                        <item.icon className="h-4 w-4" />
                        <span>{item.title}</span>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  );
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </div>
      </SidebarContent>

      <SidebarFooter>
        <div className="border-border/40 flex w-full min-w-0 items-center justify-between border-t p-4">
          <div className="flex min-w-0 items-center gap-2">
            <div className="bg-primary/10 text-primary flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-semibold">
              MK
            </div>
            <span className="truncate text-sm font-medium tracking-wide uppercase">
              Mradul Kumar
            </span>
          </div>
          <div className="text-muted-foreground flex items-center gap-1">
            <button className="hover:bg-muted hover:text-foreground flex h-7 w-7 items-center justify-center rounded-md transition-colors">
              <RiMoreFill className="h-4 w-4" />
            </button>
            <button className="hover:bg-muted hover:text-foreground relative flex h-7 w-7 items-center justify-center rounded-md transition-colors">
              <RiNotification3Line className="h-4 w-4" />
              <span className="absolute top-1.5 right-1.5 flex h-1.5 w-1.5">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-blue-400 opacity-75"></span>
                <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-blue-500"></span>
              </span>
            </button>
          </div>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
