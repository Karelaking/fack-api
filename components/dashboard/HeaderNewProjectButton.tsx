"use client";

import * as React from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";

export function HeaderNewProjectButton() {
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
