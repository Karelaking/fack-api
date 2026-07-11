"use client";

import * as React from "react";
import { usePathname } from "next/navigation";
import { ZoomIn, ZoomOut, Maximize2, Save, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export function HeaderCanvasControls(): React.JSX.Element | null {
  const pathname = usePathname();
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

  // Only render on the canvas page (placed after all hook calls to respect Rules of Hooks)
  if (!pathname.endsWith("/canvas")) return null;

  return (
    <div className="border-border mr-1 flex shrink-0 items-center gap-1 border-r pr-2">
      <Tooltip>
        <TooltipTrigger
          render={
            <Button
              type="button"
              size="icon"
              variant="ghost"
              aria-label="Zoom In"
              className="text-muted-foreground hover:text-foreground hidden h-7 w-7 sm:flex"
              onClick={() => triggerAction("canvas-zoom-in")}
            />
          }
        >
          <ZoomIn className="h-4 w-4" />
        </TooltipTrigger>
        <TooltipContent side="bottom">Zoom In</TooltipContent>
      </Tooltip>

      <Tooltip>
        <TooltipTrigger
          render={
            <Button
              type="button"
              size="icon"
              variant="ghost"
              aria-label="Zoom Out"
              className="text-muted-foreground hover:text-foreground hidden h-7 w-7 sm:flex"
              onClick={() => triggerAction("canvas-zoom-out")}
            />
          }
        >
          <ZoomOut className="h-4 w-4" />
        </TooltipTrigger>
        <TooltipContent side="bottom">Zoom Out</TooltipContent>
      </Tooltip>

      <Tooltip>
        <TooltipTrigger
          render={
            <Button
              type="button"
              size="icon"
              variant="ghost"
              aria-label="Fit View"
              className="text-muted-foreground hover:text-foreground hidden h-7 w-7 sm:flex"
              onClick={() => triggerAction("canvas-fit-view")}
            />
          }
        >
          <Maximize2 className="h-4 w-4" />
        </TooltipTrigger>
        <TooltipContent side="bottom">Fit View</TooltipContent>
      </Tooltip>

      <Tooltip>
        <TooltipTrigger
          render={
            <Button
              type="button"
              size="sm"
              variant="secondary"
              className="ml-1 h-8 gap-1.5 px-2.5 text-xs font-semibold"
              onClick={() => triggerAction("canvas-save")}
              disabled={isSaving}
            />
          }
        >
          {isSaving ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <Save className="h-3.5 w-3.5" />
          )}
          <span className="hidden md:inline">
            {isSaving ? "Saving..." : "Save Layout"}
          </span>
        </TooltipTrigger>
        <TooltipContent side="bottom">Persist coordinates</TooltipContent>
      </Tooltip>
    </div>
  );
}
