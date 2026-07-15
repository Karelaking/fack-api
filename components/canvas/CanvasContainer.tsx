"use client";

import * as React from "react";
import { FlowCanvas } from "./FlowCanvas";
import { EditBar } from "@/components/edit-bar/EditBar";
import type { Endpoint, Route } from "@/db/schema";
import { Button } from "@/components/ui/button";
import { RiSaveLine, RiAddLine, RiLoader2Line } from "@remixicon/react";

interface CanvasContainerProps {
  projectId: string;
  projectSlug: string;
  customDomain?: string | null;
  endpoints: (Endpoint & { routes: Route[] })[];
  routes: Route[];
  initialState?: {
    nodes: string;
    edges: string;
    viewport: string;
  };
}

/**
 * Client container linking the React Flow canvas with the side EditBar sheet.
 * Keeps track of selectedRouteId to open/close editing options.
 */
export function CanvasContainer({
  projectId,
  projectSlug,
  customDomain,
  endpoints,
  routes,
  initialState,
}: CanvasContainerProps): React.JSX.Element {
  const [selectedRouteId, setSelectedRouteId] = React.useState<string | null>(
    null,
  );
  const [prevRoutes, setPrevRoutes] = React.useState<Route[]>(routes);
  const [activeRoutes, setActiveRoutes] = React.useState<Route[]>(routes);
  const [isSaving, setIsSaving] = React.useState(false);
  const [isEditOpen, setIsEditOpen] = React.useState(false);

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

  if (routes !== prevRoutes) {
    setPrevRoutes(routes);
    setActiveRoutes(routes);
  }

  const selectedRoute = React.useMemo(() => {
    return activeRoutes.find((r) => r.id === selectedRouteId) ?? null;
  }, [activeRoutes, selectedRouteId]);

  const handleSelectRoute = (routeId: string) => {
    setSelectedRouteId(routeId);
  };

  const handleOpenEdit = (routeId: string) => {
    setSelectedRouteId(routeId);
    setIsEditOpen(true);
  };

  const handleRouteUpdated = (updatedRoute: Route) => {
    setActiveRoutes((prev) =>
      prev.map((r) => (r.id === updatedRoute.id ? updatedRoute : r)),
    );
  };

  const handleRouteDeleted = (routeId: string) => {
    setActiveRoutes((prev) => prev.filter((r) => r.id !== routeId));
    setSelectedRouteId(null);
    setIsEditOpen(false);
  };

  return (
    <div className="relative flex h-full min-h-0 w-full min-w-0 gap-4">
      <div className="relative min-h-0 min-w-0 flex-1">
        {/* Floating Action Toolbar */}
        <div className="absolute top-4 right-4 z-10 flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-8 gap-1.5 text-xs font-semibold bg-background/95 backdrop-blur-xs border-border/80 shadow-sm"
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
            className="h-8 gap-1.5 text-xs font-semibold shadow-md"
            onClick={() => triggerAction("open-add-route-dialog")}
          >
            <RiAddLine className="h-4 w-4" />
            <span>Add Route</span>
          </Button>
        </div>

        <FlowCanvas
          projectId={projectId}
          projectSlug={projectSlug}
          customDomain={customDomain}
          endpoints={endpoints}
          routes={activeRoutes}
          initialState={initialState}
          onSelectRoute={handleSelectRoute}
          onOpenEdit={handleOpenEdit}
        />
      </div>

      {/* Slide-out Edit Bar Sheet drawer panel */}
      {selectedRoute && (
        <EditBar
          route={selectedRoute}
          projectSlug={projectSlug}
          customDomain={customDomain}
          endpoints={endpoints}
          open={isEditOpen}
          onOpenChange={setIsEditOpen}
          onRouteUpdated={handleRouteUpdated}
          onRouteDeleted={handleRouteDeleted}
        />
      )}
    </div>
  );
}
export default CanvasContainer;
