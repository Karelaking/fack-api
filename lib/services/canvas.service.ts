/**
 * Fack AI API Architect — Canvas Domain Service
 *
 * Computes deterministic layouts for React Flow nodes and edges when
 * endpoints and routes are generated or modified, persisting canvas state.
 */

import { db } from "@/db";
import { canvasStates, type CanvasState } from "@/db/schema";
import { generateId } from "@/lib/utils";
import type { DatabaseExecutor, EndpointWithRoutes } from "./endpoint.service";

export interface CanvasNodeLayout {
  id: string;
  type: "endpointGroup" | "routeNode";
  position: { x: number; y: number };
  data: Record<string, unknown>;
  parentId?: string;
  extent?: "parent";
  style?: Record<string, unknown>;
}

export interface CanvasEdgeLayout {
  id: string;
  source: string;
  target: string;
  animated?: boolean;
  style?: Record<string, unknown>;
}

export interface CanvasLayoutResult {
  nodes: CanvasNodeLayout[];
  edges: CanvasEdgeLayout[];
  viewport: { x: number; y: number; zoom: number };
}

/**
 * Reconciles and arranges nodes for endpoints and routes to prevent visual overlaps.
 */
export function computeCanvasLayout(
  endpoints: EndpointWithRoutes[],
  existingNodesJson?: string,
  existingEdgesJson?: string,
  existingViewportJson?: string,
): CanvasLayoutResult {
  let existingNodes: CanvasNodeLayout[] = [];
  if (existingNodesJson) {
    try {
      const parsed = JSON.parse(existingNodesJson);
      if (Array.isArray(parsed)) {
        existingNodes = parsed;
      }
    } catch {
      existingNodes = [];
    }
  }

  let existingEdges: CanvasEdgeLayout[] = [];
  if (existingEdgesJson) {
    try {
      const parsed = JSON.parse(existingEdgesJson);
      if (Array.isArray(parsed)) {
        existingEdges = parsed;
      }
    } catch {
      existingEdges = [];
    }
  }

  let viewport = { x: 0, y: 0, zoom: 1 };
  if (existingViewportJson) {
    try {
      viewport = JSON.parse(existingViewportJson);
    } catch {
      viewport = { x: 0, y: 0, zoom: 1 };
    }
  }

  const reconciledNodes: CanvasNodeLayout[] = [];
  const groupWidth = 300;

  endpoints.forEach((ep, epIndex) => {
    const groupId = `group-${ep.id}`;
    const existingGroup = existingNodes.find((n) => n.id === groupId);
    const groupHeight = 110 + ep.routes.length * 96;

    if (existingGroup) {
      reconciledNodes.push({
        ...existingGroup,
        data: { label: ep.name, basePath: ep.basePath },
        style: {
          ...existingGroup.style,
          width: groupWidth,
          height: groupHeight,
        },
      });
    } else {
      reconciledNodes.push({
        id: groupId,
        type: "endpointGroup",
        position: {
          x: 40 + epIndex * 380,
          y: 40,
        },
        data: { label: ep.name, basePath: ep.basePath },
        style: {
          width: groupWidth,
          height: groupHeight,
        },
      });
    }

    ep.routes.forEach((route, routeIndex) => {
      const existingRouteNode = existingNodes.find((n) => n.id === route.id);
      const routeData = {
        id: route.id,
        method: route.method,
        path: route.path,
        statusCode: route.statusCode,
        isEnabled: route.isEnabled,
        latencyMin: route.latencyMin ?? 0,
        latencyMax: route.latencyMax ?? 0,
        errorRate: route.errorRate ?? 0,
        responseSchema: route.responseSchema ?? "{}",
      };

      if (existingRouteNode) {
        reconciledNodes.push({
          ...existingRouteNode,
          parentId: groupId,
          extent: "parent",
          data: routeData,
        });
      } else {
        reconciledNodes.push({
          id: route.id,
          type: "routeNode",
          parentId: groupId,
          extent: "parent",
          position: {
            x: 30,
            y: 56 + routeIndex * 96,
          },
          data: routeData,
        });
      }
    });
  });

  const activeRouteIds = new Set(
    endpoints.flatMap((ep) => ep.routes.map((r) => r.id)),
  );
  const reconciledEdges = existingEdges.filter(
    (edge) =>
      activeRouteIds.has(edge.source) && activeRouteIds.has(edge.target),
  );

  return {
    nodes: reconciledNodes,
    edges: reconciledEdges,
    viewport,
  };
}

/**
 * Persists the updated canvas layout to the database.
 */
export async function persistCanvasState(
  projectId: string,
  layout: CanvasLayoutResult,
  executor: DatabaseExecutor = db,
): Promise<CanvasState> {
  const nodesString = JSON.stringify(layout.nodes);
  const edgesString = JSON.stringify(layout.edges);
  const viewportString = JSON.stringify(layout.viewport);

  const [saved] = await executor
    .insert(canvasStates)
    .values({
      id: generateId(),
      projectId,
      nodes: nodesString,
      edges: edgesString,
      viewport: viewportString,
    })
    .onConflictDoUpdate({
      target: canvasStates.projectId,
      set: {
        nodes: nodesString,
        edges: edgesString,
        viewport: viewportString,
      },
    })
    .returning();

  return saved;
}
