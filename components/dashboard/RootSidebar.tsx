"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ProfileDialog } from "@/components/dashboard/ProfileDialog";
import { useUser } from "@clerk/nextjs";
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
    href: "/dashboard",
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
  const { user } = useUser();

  return (
    <Sidebar variant="sidebar" collapsible="icon">
      <SidebarHeader>
        <div className="flex flex-col gap-4 px-2 pt-2">
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton size="lg">
                <div className="bg-primary/20 text-primary flex aspect-square size-8 items-center justify-center rounded-lg">
                  <span className="text-sm font-bold">W</span>
                </div>
                <div className="grid flex-1 text-left text-sm leading-tight group-data-[collapsible=icon]:hidden">
                  <span className="truncate font-semibold">
                    Mradul Kumar&apos;s Workspace
                  </span>
                  <span className="text-muted-foreground truncate text-xs">
                    Hobby
                  </span>
                </div>
                <RiArrowUpDownLine className="ml-auto h-4 w-4 shrink-0 group-data-[collapsible=icon]:hidden" />
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>

          <div
            className="relative cursor-pointer px-2 group-data-[collapsible=icon]:hidden"
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
            <div className="border-border bg-muted/50 text-muted-foreground pointer-events-none absolute top-1/2 right-3.5 flex h-5 w-5 -translate-y-1/2 items-center justify-center rounded-lg border text-[10px] font-medium uppercase">
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
        <div className="border-border/40 flex w-full min-w-0 items-center justify-between border-t p-4 group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:p-2">
          <ProfileDialog>
            <button className="hover:bg-muted focus-visible:ring-primary -ml-1 flex min-w-0 flex-1 cursor-pointer items-center gap-2 rounded-md p-1 text-left transition-colors outline-none group-data-[collapsible=icon]:ml-0 focus-visible:ring-2">
              {user?.imageUrl ? (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img
                  src={user.imageUrl}
                  alt="Profile"
                  className="h-7 w-7 shrink-0 rounded-full object-cover"
                />
              ) : (
                <div className="bg-primary/10 text-primary flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-semibold">
                  {user?.firstName?.charAt(0) || "U"}
                </div>
              )}
              <span className="flex-1 truncate text-sm font-medium tracking-wide uppercase group-data-[collapsible=icon]:hidden">
                {user?.fullName || "User"}
              </span>
            </button>
          </ProfileDialog>
          <div className="text-muted-foreground flex shrink-0 items-center gap-1 group-data-[collapsible=icon]:hidden">
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
