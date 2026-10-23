import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { notes, projects } from "@/db/schema";
import { eq } from "drizzle-orm";
import { generateId } from "@/lib/utils";
import {
  assertProjectOwnedBy,
  authErrorResponse,
  requireUserId,
} from "@/lib/auth";
import { createNoteSchema } from "@/lib/validators";

/**
 * /api/projects/[slug]/notes — list and create project notes.
 *
 * Notes inherit the active storage mode: they stay in the private local
 * database when no API keys are configured and sync to the remote database
 * when database API keys are present.
 */

async function resolveProject(slug: string, userId: string) {
  const project = await db.query.projects.findFirst({
    where: eq(projects.slug, slug),
  });
  if (!project) return null;
  assertProjectOwnedBy(project, userId);
  return project;
}

export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ slug: string }> },
) {
  try {
    const { slug } = await context.params;
    const userId = await requireUserId();
    const project = await resolveProject(slug, userId);
    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    const projectNotes = await db.query.notes.findMany({
      where: eq(notes.projectId, project.id),
      orderBy: (note, { desc }) => [desc(note.pinned), desc(note.updatedAt)],
    });

    return NextResponse.json({ notes: projectNotes });
  } catch (error: unknown) {
    const authResponse = authErrorResponse(error);
    if (authResponse) return authResponse;
    return NextResponse.json(
      { error: "Failed to list notes" },
      { status: 500 },
    );
  }
}

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ slug: string }> },
) {
  try {
    const { slug } = await context.params;
    const userId = await requireUserId();
    const project = await resolveProject(slug, userId);
    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    const body = await request.json();
    const parsed = createNoteSchema.parse({ ...body, projectId: project.id });

    const [note] = await db
      .insert(notes)
      .values({
        id: generateId(),
        projectId: project.id,
        title: parsed.title ?? "",
        content: parsed.content ?? "",
        pinned: parsed.pinned ?? false,
      })
      .returning();

    return NextResponse.json({ note }, { status: 201 });
  } catch (error: unknown) {
    const authResponse = authErrorResponse(error);
    if (authResponse) return authResponse;
    const message = error instanceof Error ? error.message : "Invalid note";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
