"use client";

import * as React from "react";
import { usePathname, useRouter } from "next/navigation";
import { RiAddLine } from "@remixicon/react";
import { Button } from "@/components/ui/button";

export function HeaderAddRouteButton(): React.JSX.Element | null {
  const pathname = usePathname();
  const router = useRouter();
  const segments = pathname.split("/").filter(Boolean);
  const isProjectPage = segments[0] === "projects" && segments[1];

  // Only show when inside a project subpage
  if (!isProjectPage) return null;

  const handleClick = () => {
    if (pathname.endsWith("/canvas")) {
      window.dispatchEvent(new CustomEvent("open-add-route-dialog"));
    } else {
      router.push(`/projects/${segments[1]}/canvas?newRoute=true`);
    }
  };

  return (
    <Button
      type="button"
      size="sm"
      variant="default"
      className="h-8 shrink-0 gap-1 text-xs font-semibold"
      onClick={handleClick}
    >
      <RiAddLine className="h-3.5 w-3.5" />
      <span className="hidden sm:inline">Add Route</span>
    </Button>
  );
}
