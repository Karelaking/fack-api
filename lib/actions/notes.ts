"use server";

import { db } from "@/db";
import { notes, type Note } from "@/db/schema";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { generateId } from "@/lib/utils";
import { requireNoteAccess, requireProjectAccess } from "@/lib/auth";
import {
  createNoteSchema,
  updateNoteSchema,
  type CreateNoteInput,
  type UpdateNoteInput,
} from "@/lib/validators";

/**
 * Notes are stored in the active database, which is a private local file
 * when no database API keys are configured and the remote database when
 * they are — no extra storage configuration is needed.
 */

export async function getNotes(projectId: string): Promise<Note[]> {
  await requireProjectAccess(projectId);
  return db.query.notes.findMany({
    where: eq(notes.projectId, projectId),
    orderBy: (note, { desc }) => [desc(note.pinned), desc(note.updatedAt)],
  });
}

export async function createNote(input: CreateNoteInput): Promise<Note> {
  const parsed = createNoteSchema.parse(input);
  await requireProjectAccess(parsed.projectId);

  const [note] = await db
    .insert(notes)
    .values({
      id: generateId(),
      projectId: parsed.projectId,
      title: parsed.title ?? "",
      content: parsed.content ?? "",
      pinned: parsed.pinned ?? false,
    })
    .returning();

  revalidatePath("/");
  return note;
}

export async function updateNote(input: UpdateNoteInput): Promise<Note> {
  const parsed = updateNoteSchema.parse(input);
  await requireNoteAccess(parsed.id);

  const { id, ...updates } = parsed;
  const [note] = await db
    .update(notes)
    .set({ ...updates, updatedAt: new Date() })
    .where(eq(notes.id, id))
    .returning();

  revalidatePath("/");
  return note;
}

export async function deleteNote(id: string): Promise<void> {
  await requireNoteAccess(id);
  await db.delete(notes).where(eq(notes.id, id));
  revalidatePath("/");
}
