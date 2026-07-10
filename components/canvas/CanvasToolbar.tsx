"use client";

import * as React from "react";
import { Plus, Maximize2, ZoomIn, ZoomOut, Save, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

interface CanvasToolbarProps {
  onAddRoute: () => void;
  onFitView: () => void;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onSave: () => void;
  isSaving: boolean;
}

/**
 * Floating toolbar component overlays on top of the React Flow canvas workspace.
 */
export function CanvasToolbar({
  onAddRoute,
  onFitView,
  onZoomIn,
  onZoomOut,
  onSave,
  isSaving,
}: CanvasToolbarProps) {
  return (
    <div className="absolute bottom-4 left-4 z-10 flex items-center gap-1.5 bg-card/90 backdrop-blur border border-border p-1.5 rounded-lg shadow-md shrink-0">
      <Tooltip>
        <TooltipTrigger render={<Button size="sm" variant="default" className="h-8 gap-1.5 font-semibold text-xs" onClick={onAddRoute} />}>
          <Plus className="h-3.5 w-3.5" />
          <span>Add Route</span>
        </TooltipTrigger>
        <TooltipContent side="top">Add new HTTP route</TooltipContent>
      </Tooltip>

      <Separator orientation="vertical" className="h-5" />

      <Tooltip>
        <TooltipTrigger render={<Button size="icon" variant="outline" className="h-8 w-8" onClick={onZoomIn} />}>
          <ZoomIn className="h-4 w-4" />
        </TooltipTrigger>
        <TooltipContent side="top">Zoom In</TooltipContent>
      </Tooltip>

      <Tooltip>
        <TooltipTrigger render={<Button size="icon" variant="outline" className="h-8 w-8" onClick={onZoomOut} />}>
          <ZoomOut className="h-4 w-4" />
        </TooltipTrigger>
        <TooltipContent side="top">Zoom Out</TooltipContent>
      </Tooltip>

      <Tooltip>
        <TooltipTrigger render={<Button size="icon" variant="outline" className="h-8 w-8" onClick={onFitView} />}>
          <Maximize2 className="h-4 w-4" />
        </TooltipTrigger>
        <TooltipContent side="top">Fit View</TooltipContent>
      </Tooltip>

      <Separator orientation="vertical" className="h-5" />

      <Tooltip>
        <TooltipTrigger render={<Button size="sm" variant="secondary" className="h-8 gap-1.5 text-xs font-semibold" onClick={onSave} disabled={isSaving} />}>
          {isSaving ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <Save className="h-3.5 w-3.5" />
          )}
          <span>{isSaving ? "Saving..." : "Save Canvas"}</span>
        </TooltipTrigger>
        <TooltipContent side="top">Persist node coordinate layout</TooltipContent>
      </Tooltip>
    </div>
  );
}
