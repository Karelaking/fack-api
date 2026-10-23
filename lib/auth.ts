/**
 * Fack AI API Architect — Authorization Guards
 *
 * Server-side helpers that enforce authentication and per-project ownership
 * across server actions and API route handlers.
 *
 * NOTE: The public mock runtime (`/api/mock/**`) is intentionally NOT guarded.
 * Mock endpoints exist to be consumed by external clients without credentials,
 * so protecting them would defeat the product's purpose.
 */

import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";

import { db } from "@/db";
import { endpoints, notes, projects, routes, webhooks } from "@/db/schema";

/** Thrown when a request has no authenticated Clerk user. */
export class UnauthorizedError extends Error {
  constructor(message = "Unauthorized") {
    super(message);
    this.name = "UnauthorizedError";
  }
}

/** Thrown when a user is authenticated but lacks access to the resource. */
export class ForbiddenError extends Error {
  constructor(message = "Forbidden") {
    super(message);
    this.name = "ForbiddenError";
  }
}

/**
 * Returns the authenticated Clerk user id.
 *
 * @throws {UnauthorizedError} when there is no signed-in user.
 */
export async function requireUserId(): Promise<string> {
  const { userId } = await auth();
  if (!userId) {
    throw new UnauthorizedError();
  }
  return userId;
}

/**
 * Returns true when a project row is owned by the user.
 *
 * System-owned projects are shared and readable by any authenticated user.
 */
export function isProjectOwnedBy(
  project: { userId: string | null },
  userId: string,
): boolean {
  return project.userId === userId || project.userId === "system";
}

/**
 * Throws when the project row is not accessible to the user.
 *
 * @throws {ForbiddenError} when the project belongs to another user.
 */
export function assertProjectOwnedBy(
  project: { userId: string | null },
  userId: string,
): void {
  if (!isProjectOwnedBy(project, userId)) {
    throw new ForbiddenError("You do not have access to this project");
  }
}

/**
 * Loads a project and throws when the user may not access it.
 *
 * Assumes the caller already authenticated the user.
 */
async function assertProjectIdAccess(
  projectId: string,
  userId: string,
): Promise<void> {
  const project = await db.query.projects.findFirst({
    where: eq(projects.id, projectId),
    columns: { userId: true },
  });

  if (!project) {
    throw new ForbiddenError("Project not found");
  }

  assertProjectOwnedBy(project, userId);
}

/**
 * Resolves a project and verifies the current user may access it.
 *
 * @returns the authenticated user id.
 * @throws {UnauthorizedError|ForbiddenError}
 */
export async function requireProjectAccess(projectId: string): Promise<string> {
  const userId = await requireUserId();
  await assertProjectIdAccess(projectId, userId);
  return userId;
}

/**
 * Resolves the project owning an endpoint and verifies access.
 *
 * Authentication is checked before the resource is resolved so that
 * unauthenticated callers always receive a 401, never a resource-existence
 * signal.
 *
 * @returns the authenticated user id.
 * @throws {UnauthorizedError|ForbiddenError}
 */
export async function requireEndpointAccess(
  endpointId: string,
): Promise<string> {
  const userId = await requireUserId();

  const endpoint = await db.query.endpoints.findFirst({
    where: eq(endpoints.id, endpointId),
    columns: { projectId: true },
  });

  if (!endpoint) {
    throw new ForbiddenError("Endpoint not found");
  }

  await assertProjectIdAccess(endpoint.projectId, userId);
  return userId;
}

/**
 * Resolves the project owning a route and verifies access.
 *
 * @returns the authenticated user id.
 * @throws {UnauthorizedError|ForbiddenError}
 */
export async function requireRouteAccess(routeId: string): Promise<string> {
  const userId = await requireUserId();

  const route = await db.query.routes.findFirst({
    where: eq(routes.id, routeId),
    columns: { endpointId: true },
    with: { endpoint: { columns: { projectId: true } } },
  });

  if (!route || !route.endpoint) {
    throw new ForbiddenError("Route not found");
  }

  await assertProjectIdAccess(route.endpoint.projectId, userId);
  return userId;
}

/**
 * Resolves the project owning a webhook and verifies access.
 *
 * @returns the authenticated user id.
 * @throws {UnauthorizedError|ForbiddenError}
 */
export async function requireWebhookAccess(webhookId: string): Promise<string> {
  const userId = await requireUserId();

  const webhook = await db.query.webhooks.findFirst({
    where: eq(webhooks.id, webhookId),
    columns: { routeId: true },
    with: {
      route: {
        columns: { endpointId: true },
        with: { endpoint: { columns: { projectId: true } } },
      },
    },
  });

  if (!webhook || !webhook.route || !webhook.route.endpoint) {
    throw new ForbiddenError("Webhook not found");
  }

  await assertProjectIdAccess(webhook.route.endpoint.projectId, userId);
  return userId;
}

/**
 * Resolves the project owning a note and verifies access.
 *
 * @returns the authenticated user id.
 * @throws {UnauthorizedError|ForbiddenError}
 */
export async function requireNoteAccess(noteId: string): Promise<string> {
  const userId = await requireUserId();

  const note = await db.query.notes.findFirst({
    where: eq(notes.id, noteId),
    columns: { projectId: true },
  });

  if (!note) {
    throw new ForbiddenError("Note not found");
  }

  await assertProjectIdAccess(note.projectId, userId);
  return userId;
}

/**
 * Maps an authorization error to a JSON `NextResponse`.
 *
 * @returns a 401/403 response, or `null` when the error is unrelated.
 */
export function authErrorResponse(error: unknown): NextResponse | null {
  if (error instanceof UnauthorizedError) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 401 },
    );
  }
  if (error instanceof ForbiddenError) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 403 },
    );
  }
  return null;
}
