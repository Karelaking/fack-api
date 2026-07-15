"use client";

import * as React from "react";
import { usePathname } from "next/navigation";
import { RiAddLine, RiSaveLine, RiLoader2Line } from "@remixicon/react";
import { Button } from "@/components/ui/button";

export function HeaderNewProjectButton(): React.JSX.Element | null {
  const pathname = usePathname();
  const segments = pathname.split("/").filter(Boolean);
  
  const isProjectPage = segments[0] === "projects" && segments[1];
  const isCanvasPage = isProjectPage && segments[segments.length - 1] === "canvas";

  const [isSaving, setIsSaving] = React.useState(false);

  React.useEffect(() => {
    const handleSaveStart = () => setIsSaving(true);
    const handleSaveEnd = () => setIsSaving(false);

    window.addEventListener("canvas-save-start", handleSaveStart);
    window.addEventListener("canvas-save-end", handleSaveEnd);

    return () => {
      window.removeEventListener("canvas-save-start", handleSaveStart);
      window.removeEventListener("canvas-save-end", handleSaveEnd);
    };
  }, []);

  const triggerAction = (action: string) => {
    window.dispatchEvent(new CustomEvent(action));
  };

  if (isCanvasPage) {
    return (
      <div className="flex items-center gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="h-8 gap-1.5 text-xs font-semibold"
          onClick={() => triggerAction("canvas-save")}
          disabled={isSaving}
        >
          {isSaving ? (
            <RiLoader2Line className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <RiSaveLine className="h-3.5 w-3.5" />
          )}
          <span>{isSaving ? "Saving..." : "Save Layout"}</span>
        </Button>
        <Button
          type="button"
          variant="default"
          size="sm"
          className="h-8 gap-1.5 text-xs font-semibold shadow-xs"
          onClick={() => triggerAction("open-add-route-dialog")}
        >
          <RiAddLine className="h-4 w-4" />
          <span>Add Route</span>
        </Button>
      </div>
    );
  }

  // Hide the global project creation button if inside a project page but not the canvas (e.g. settings/logs)
  if (isProjectPage) return null;

  const handleNewProjectClick = () => {
    window.dispatchEvent(new CustomEvent("open-new-project-dialog"));
  };

  return (
    <Button
      type="button"
      size="sm"
      variant="outline"
      className="gap-1.5"
      onClick={handleNewProjectClick}
    >
      <RiAddLine className="h-4 w-4" />
      <span className="hidden sm:inline">New Project</span>
    </Button>
  );
}
