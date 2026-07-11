"use client";

import * as React from "react";
import { FlowCanvas } from "./FlowCanvas";
import { EditBar } from "@/components/edit-bar/EditBar";
import type { Endpoint, Route } from "@/db/schema";

interface CanvasContainerProps {
  projectId: string;
  projectSlug: string;
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
  endpoints,
  routes,
  initialState,
}: CanvasContainerProps): React.JSX.Element {
  const [selectedRouteId, setSelectedRouteId] = React.useState<string | null>(
    null,
  );
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
      prev.map((r) => (r.id === updatedRoute.id ? updatedRoute : r)),
    );
  };

  const handleRouteDeleted = (routeId: string) => {
    setActiveRoutes((prev) => prev.filter((r) => r.id !== routeId));
    setSelectedRouteId(null);
  };

  return (
    <div className="relative flex h-[calc(100vh-3.5rem)] min-h-0 w-full min-w-0 gap-4">
      <div className="relative min-h-0 min-w-0 flex-1">
        <FlowCanvas
          projectId={projectId}
          projectSlug={projectSlug}
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
          projectSlug={projectSlug}
          endpoints={endpoints}
          open={!!selectedRouteId}
          onOpenChange={(open) => {
            if (!open) setSelectedRouteId(null);
          }}
          onRouteUpdated={handleRouteUpdated}
          onRouteDeleted={handleRouteDeleted}
        />
      )}
    </div>
  );
}
export default CanvasContainer;
