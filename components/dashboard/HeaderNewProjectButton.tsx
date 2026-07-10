"use client";

import * as React from "react";
import { usePathname } from "next/navigation";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";

export function HeaderNewProjectButton() {
  const pathname = usePathname();
  const segments = pathname.split("/").filter(Boolean);
  const isProjectPage = segments[0] === "projects" && segments[1];

  // Hide the global project creation button if inside a specific project workspace
  if (isProjectPage) return null;

  const handleClick = () => {
    window.dispatchEvent(new CustomEvent("open-new-project-dialog"));
  };

  return (
    <Button type="button" size="sm" variant="outline" className="gap-1.5" onClick={handleClick}>
      <Plus className="h-4 w-4" />
      <span className="hidden sm:inline">New Project</span>
    </Button>
  );
}
