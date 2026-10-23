import { describe, expect, it, vi } from "vite-plus/test";

// Server actions call revalidatePath, which requires a Next.js request
// scope; stub it so the actions can run under Vitest.
vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
  revalidateTag: vi.fn(),
  unstable_cache: (fn: unknown) => fn,
}));

import { createProject, deleteProject } from "../lib/actions/projects";
import {
  createNote,
  deleteNote,
  getNotes,
  updateNote,
} from "../lib/actions/notes";
import { createNoteSchema, updateNoteSchema } from "../lib/validators";

describe("notes actions", () => {
  it("creates, lists, updates, and deletes notes", async () => {
    const project = await createProject({ name: "Notes Project" });

    const created = await createNote({
      projectId: project.id,
      title: "First",
      content: "Hello world",
    });
    expect(created.title).toBe("First");
    expect(created.pinned).toBe(false);

    const listed = await getNotes(project.id);
    expect(listed.map((note) => note.id)).toContain(created.id);

    const updated = await updateNote({
      id: created.id,
      title: "First (edited)",
      content: "Updated body",
      pinned: true,
    });
    expect(updated.title).toBe("First (edited)");
    expect(updated.pinned).toBe(true);

    await deleteNote(created.id);
    const afterDelete = await getNotes(project.id);
    expect(afterDelete.map((note) => note.id)).not.toContain(created.id);

    await deleteProject(project.id);
  });

  it("lists pinned notes before unpinned notes", async () => {
    const project = await createProject({ name: "Pin Order Project" });

    const regular = await createNote({
      projectId: project.id,
      title: "Regular",
    });
    const pinned = await createNote({
      projectId: project.id,
      title: "Pinned",
      pinned: true,
    });

    const listed = await getNotes(project.id);
    const ids = listed.map((note) => note.id);
    expect(ids.indexOf(pinned.id)).toBeLessThan(ids.indexOf(regular.id));

    await deleteProject(project.id);
  });

  it("rejects empty project ids", async () => {
    await expect(createNote({ projectId: "" })).rejects.toThrow();
  });

  it("enforces validator limits", () => {
    expect(
      createNoteSchema.safeParse({ projectId: "p", title: "x".repeat(201) })
        .success,
    ).toBe(false);
    expect(
      updateNoteSchema.safeParse({ id: "n", content: "y".repeat(100_001) })
        .success,
    ).toBe(false);
    expect(updateNoteSchema.safeParse({ id: "n", pinned: true }).success).toBe(
      true,
    );
  });
});
