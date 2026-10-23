import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { notes } from "@/db/schema";
import { eq } from "drizzle-orm";
import { authErrorResponse, requireNoteAccess } from "@/lib/auth";
import { updateNoteSchema } from "@/lib/validators";

/**
 * /api/projects/[slug]/notes/[noteId] — read, update, or delete a note.
 */

export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ slug: string; noteId: string }> },
) {
  try {
    const { noteId } = await context.params;
    await requireNoteAccess(noteId);

    const note = await db.query.notes.findFirst({
      where: eq(notes.id, noteId),
    });
    if (!note) {
      return NextResponse.json({ error: "Note not found" }, { status: 404 });
    }

    return NextResponse.json({ note });
  } catch (error: unknown) {
    const authResponse = authErrorResponse(error);
    if (authResponse) return authResponse;
    return NextResponse.json({ error: "Failed to load note" }, { status: 500 });
  }
}

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ slug: string; noteId: string }> },
) {
  try {
    const { noteId } = await context.params;
    await requireNoteAccess(noteId);

    const body = await request.json();
    const parsed = updateNoteSchema.parse({ ...body, id: noteId });

    const { id, ...updates } = parsed;
    const [note] = await db
      .update(notes)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(notes.id, id))
      .returning();

    if (!note) {
      return NextResponse.json({ error: "Note not found" }, { status: 404 });
    }

    return NextResponse.json({ note });
  } catch (error: unknown) {
    const authResponse = authErrorResponse(error);
    if (authResponse) return authResponse;
    const message = error instanceof Error ? error.message : "Invalid note";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

export async function DELETE(
  _request: NextRequest,
  context: { params: Promise<{ slug: string; noteId: string }> },
) {
  try {
    const { noteId } = await context.params;
    await requireNoteAccess(noteId);

    await db.delete(notes).where(eq(notes.id, noteId));
    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    const authResponse = authErrorResponse(error);
    if (authResponse) return authResponse;
    return NextResponse.json(
      { error: "Failed to delete note" },
      { status: 500 },
    );
  }
}
