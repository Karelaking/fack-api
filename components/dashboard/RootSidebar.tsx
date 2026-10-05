"use client";

import * as React from "react";
import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
} from "@/components/ui/sidebar";

export function RootSidebar(): React.JSX.Element {
  return (
    <Sidebar>
      <SidebarHeader>
        {/* Header reserved for future content/logo */}
      </SidebarHeader>
      <SidebarContent>
        {/* Sidebar content reserved for future links */}
      </SidebarContent>
    </Sidebar>
  );
}
