/**
 * Fack AI API Architect — Draft Preview Derivation
 *
 * Converts an agent change set into the geometry the canvas needs to render
 * unapplied ("draft") endpoints and routes: brand-new groups to draw, brand-new
 * routes to place inside them, and marks to overlay on routes that already
 * exist. Pure and synchronous so it can be unit-tested without a browser.
 */

import type { Endpoint, HttpMethod, Route } from "@/db/schema";
import type { ApiChangeSet } from "@/lib/types/ai.type";

export type DraftChangeType = "create" | "update" | "delete";

/** Overlay applied to a node that is part of an unapplied change set. */
export interface DraftMark {
  changeType: DraftChangeType;
  hasConflict: boolean;
  /** Drives the sequential entrance animation. */
  order: number;
}

export interface DraftGroupBlueprint {
  /** Canvas node id, unique across real and draft nodes. */
  id: string;
  label: string;
  basePath: string;
  order: number;
}

export interface DraftRouteBlueprint {
  /** Canvas node id, unique across real and draft nodes. */
  id: string;
  /** Id of the group node this route belongs to. */
  parentId: string;
  method: HttpMethod;
  path: string;
  statusCode: number;
  latencyMin: number;
  latencyMax: number;
  errorRate: number;
  mark: DraftMark;
}

export interface DraftPlan {
  groups: DraftGroupBlueprint[];
  routes: DraftRouteBlueprint[];
  /** Keyed by existing route id: routes that will change or disappear. */
  marks: Record<string, DraftMark>;
  /** Total number of draft visuals, used to detect "a preview is showing". */
  total: number;
}

export const EMPTY_DRAFT_PLAN: DraftPlan = {
  groups: [],
  routes: [],
  marks: {},
  total: 0,
};

/** Normalises an endpoint name or path segment into a stable id fragment. */
export function draftSlug(value: string): string {
  const slug = value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return slug || "endpoint";
}

/**
 * Whether a conflict path refers to the same route as a generated path.
 *
 * Conflict paths are absolute (server base path included) while a generated
 * route path may be relative, so an exact match is tried first and a
 * suffix match second.
 */
function pathsMatch(conflictPath: string, routePath: string): boolean {
  const left = conflictPath.trim().replace(/\/+$/, "") || "/";
  const right = routePath.trim().replace(/\/+$/, "") || "/";
  if (left === right) return true;
  if (right === "/") return false;
  return left.endsWith(right);
}

/**
 * Builds the draft plan for a change set.
 *
 * Endpoints that already exist are reused: their new routes are parented to the
 * existing group instead of a draft one.
 */
export function buildDraftPlan(
  changeSet: ApiChangeSet | null | undefined,
  endpoints: (Endpoint & { routes: Route[] })[],
): DraftPlan {
  if (!changeSet) {
    return EMPTY_DRAFT_PLAN;
  }

  const conflicts = changeSet.conflicts ?? [];
  const groupIdByEndpointName = new Map<string, string>();

  endpoints.forEach((endpoint) => {
    groupIdByEndpointName.set(
      endpoint.name.trim().toLowerCase(),
      `group-${endpoint.id}`,
    );
  });

  const groups: DraftGroupBlueprint[] = [];

  changeSet.endpointsToCreate.forEach((endpoint, index) => {
    const key = endpoint.name.trim().toLowerCase();
    // An endpoint that already exists keeps its real group.
    if (groupIdByEndpointName.has(key)) {
      return;
    }
    const id = `preview-group-${draftSlug(endpoint.name)}`;
    groupIdByEndpointName.set(key, id);
    groups.push({
      id,
      label: endpoint.name,
      basePath: endpoint.basePath,
      order: index,
    });
  });

  const routes: DraftRouteBlueprint[] = [];

  changeSet.routesToCreate.forEach((item, index) => {
    const endpointKey = item.endpointName.trim().toLowerCase();
    let parentId = item.endpointId
      ? `group-${item.endpointId}`
      : groupIdByEndpointName.get(endpointKey);

    if (!parentId) {
      // The change set named an endpoint the client has never seen, so give it
      // a draft group of its own rather than orphaning the route.
      parentId = `preview-group-${draftSlug(item.endpointName)}`;
      groupIdByEndpointName.set(endpointKey, parentId);
      groups.push({
        id: parentId,
        label: item.endpointName,
        basePath: "",
        order: groups.length,
      });
    }

    routes.push({
      id: `preview-route-${draftSlug(item.endpointName)}-${item.route.method.toLowerCase()}-${draftSlug(item.route.path)}`,
      parentId,
      method: item.route.method,
      path: item.route.path,
      statusCode: item.route.statusCode,
      latencyMin: item.route.latency?.min ?? 0,
      latencyMax: item.route.latency?.max ?? 0,
      errorRate: item.route.errorRate ?? 0,
      mark: {
        changeType: "create",
        hasConflict: conflicts.some(
          (conflict) =>
            conflict.method === item.route.method &&
            pathsMatch(conflict.path, item.route.path),
        ),
        order: index,
      },
    });
  });

  const marks: Record<string, DraftMark> = {};

  changeSet.routesToUpdate.forEach((item, index) => {
    marks[item.routeId] = {
      changeType: "update",
      hasConflict: conflicts.some(
        (conflict) => conflict.existingRouteId === item.routeId,
      ),
      order: routes.length + index,
    };
  });

  changeSet.routesToDelete.forEach((item, index) => {
    marks[item.routeId] = {
      changeType: "delete",
      hasConflict: conflicts.some(
        (conflict) => conflict.existingRouteId === item.routeId,
      ),
      order: routes.length + changeSet.routesToUpdate.length + index,
    };
  });

  return {
    groups,
    routes,
    marks,
    total: groups.length + routes.length + Object.keys(marks).length,
  };
}
