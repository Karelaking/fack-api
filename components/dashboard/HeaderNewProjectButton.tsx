"use client";

import * as React from "react";
import { usePathname } from "next/navigation";
import {
  RiAddLine,
  RiSaveLine,
  RiLoader2Line,
  RiSparkling2Fill,
  RiDownloadLine,
  RiUploadCloud2Line,
  RiMoreLine,
} from "@remixicon/react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { OPEN_AGENT_COMPOSER_EVENT } from "@/lib/ai/agent-events";

export function HeaderNewProjectButton(): React.JSX.Element | null {
  const pathname = usePathname();
  const segments = pathname.split("/").filter(Boolean);

  const isProjectPage = segments[0] === "projects" && segments[1];
  const isCanvasPage =
    isProjectPage && segments[segments.length - 1] === "canvas";

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

  const dispatchCanvasCommand = (command: string) => {
    window.dispatchEvent(new CustomEvent(command));
  };

  if (isCanvasPage) {
    const openAiArchitect = () =>
      dispatchCanvasCommand(OPEN_AGENT_COMPOSER_EVENT);
    const openImportOpenApi = () =>
      dispatchCanvasCommand("open-import-openapi-dialog");
    const exportOpenApi = () => {
      if (segments[1]) {
        window.open(`/api/projects/${segments[1]}/openapi`, "_blank");
      }
    };

    return (
      <div className="flex shrink-0 items-center gap-2">
        {/* Secondary actions: inline only when there is room for the labels. */}
        <div className="hidden items-center gap-2 xl:flex">
          <Button
            type="button"
            variant="outline"
            size="sm"
            title="AI Architect"
            aria-label="AI Architect"
            onClick={openAiArchitect}
          >
            <RiSparkling2Fill className="text-primary h-3.5 w-3.5" />
            <span>AI Architect</span>
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            title="Import OpenAPI"
            aria-label="Import OpenAPI"
            onClick={openImportOpenApi}
          >
            <RiUploadCloud2Line className="text-info h-3.5 w-3.5" />
            <span>Import OpenAPI</span>
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            title="Export OpenAPI"
            aria-label="Export OpenAPI"
            onClick={exportOpenApi}
          >
            <RiDownloadLine className="h-3.5 w-3.5" />
            <span>Export OpenAPI</span>
          </Button>
        </div>

        {/* Below xl the same secondary actions collapse into an overflow menu. */}
        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <Button
                type="button"
                variant="outline"
                size="icon-sm"
                className="xl:hidden"
                title="More canvas actions"
                aria-label="More canvas actions"
              />
            }
          >
            <RiMoreLine className="h-4 w-4" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuGroup>
              <DropdownMenuItem onClick={openAiArchitect}>
                <RiSparkling2Fill className="text-primary" />
                <span>AI Architect</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={openImportOpenApi}>
                <RiUploadCloud2Line className="text-info" />
                <span>Import OpenAPI</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={exportOpenApi}>
                <RiDownloadLine />
                <span>Export OpenAPI</span>
              </DropdownMenuItem>
            </DropdownMenuGroup>
          </DropdownMenuContent>
        </DropdownMenu>

        <Button
          type="button"
          variant="outline"
          size="sm"
          title="Save Layout"
          aria-label="Save Layout"
          onClick={() => dispatchCanvasCommand("canvas-save")}
          disabled={isSaving}
        >
          {isSaving ? (
            <RiLoader2Line
              className="h-3.5 w-3.5 animate-spin motion-reduce:animate-none"
              aria-hidden="true"
            />
          ) : (
            <RiSaveLine className="h-3.5 w-3.5" aria-hidden="true" />
          )}
          <span className="hidden sm:inline">
            {isSaving ? "Saving..." : "Save Layout"}
          </span>
        </Button>
        <Button
          type="button"
          variant="default"
          size="sm"
          title="Add Route"
          aria-label="Add Route"
          onClick={() => dispatchCanvasCommand("open-add-route-dialog")}
        >
          <RiAddLine className="h-4 w-4" aria-hidden="true" />
          <span className="hidden sm:inline">Add Route</span>
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
      variant="default"
      title="Create New Project"
      aria-label="Create New Project"
      onClick={handleNewProjectClick}
    >
      <RiAddLine className="h-4 w-4" />
      <span className="hidden sm:inline">New Project</span>
    </Button>
  );
}
