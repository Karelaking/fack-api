"use client";

import * as React from "react";
import { FlowCanvas } from "./FlowCanvas";
import { EditBar } from "@/components/edit-bar/EditBar";
import type { Endpoint, Route } from "@/db/schema";
import { parseSchemaToFields } from "@/lib/schema-synthesizer";

interface CanvasContainerProps {
  projectId: string;
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
  endpoints,
  routes,
  initialState,
}: CanvasContainerProps) {
  const [selectedRouteId, setSelectedRouteId] = React.useState<string | null>(null);
  const [prevRoutes, setPrevRoutes] = React.useState<Route[]>(routes);
  const [activeRoutes, setActiveRoutes] = React.useState<Route[]>(routes);

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

  const handleRouteUpdated = (updatedRoute: Route) => {
    setActiveRoutes((prev) =>
      prev.map((r) => (r.id === updatedRoute.id ? updatedRoute : r))
    );
  };

  return (
    <div className="w-full h-[calc(100vh-12rem)] relative flex gap-4 min-h-0 min-w-0">
      <div className="flex-1 min-h-0 min-w-0 relative">
        <FlowCanvas
          projectId={projectId}
          endpoints={endpoints}
          routes={activeRoutes}
          initialState={initialState}
          onSelectRoute={handleSelectRoute}
        />
      </div>

      {/* Slide-out Edit Bar Sheet drawer panel */}
      {selectedRoute && (
        <EditBar
          route={selectedRoute}
          open={!!selectedRouteId}
          onOpenChange={(open) => {
            if (!open) setSelectedRouteId(null);
          }}
          onRouteUpdated={handleRouteUpdated}
        />
      )}
    </div>
  );
}
export default CanvasContainer;
