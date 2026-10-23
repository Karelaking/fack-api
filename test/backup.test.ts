import { describe, expect, it, vi } from "vite-plus/test";

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
  revalidateTag: vi.fn(),
  unstable_cache: (fn: unknown) => fn,
}));

import { eq } from "drizzle-orm";

import { db } from "../db";
import { notes, projects } from "../db/schema";
import { createProject, deleteProject } from "../lib/actions/projects";
import { createNote, deleteNote, getNotes } from "../lib/actions/notes";
import {
  createBackup,
  parseBackup,
  restoreBackup,
} from "../lib/storage/backup";

describe("backup export", () => {
  it("exports every schema table, including notes", async () => {
    const project = await createProject({ name: "Backup Project" });
    await createNote({ projectId: project.id, title: "Keep me" });

    const backup = await createBackup();

    expect(backup.version).toBe(1);
    expect(Object.keys(backup.tables)).toEqual(
      expect.arrayContaining([
        "projects",
        "endpoints",
        "routes",
        "notes",
        "canvas_states",
      ]),
    );
    const exported = backup.tables.projects.find(
      (row) => row.id === project.id,
    );
    expect(exported).toBeDefined();
    expect(
      backup.tables.notes.some(
        (row) => row.projectId === project.id && row.title === "Keep me",
      ),
    ).toBe(true);

    await deleteProject(project.id);
  });
});

describe("backup validation", () => {
  it("rejects non-object payloads", () => {
    expect(() => parseBackup(null)).toThrow();
    expect(() => parseBackup([])).toThrow();
    expect(() => parseBackup("nope")).toThrow();
  });

  it("rejects unsupported versions and missing tables", () => {
    expect(() => parseBackup({ version: 99, tables: {} })).toThrow(/version/i);
    expect(() => parseBackup({ version: 1 })).toThrow(/tables/i);
  });
});

describe("backup restore", () => {
  it("restores deleted rows via upsert", async () => {
    const project = await createProject({ name: "Roundtrip Project" });
    const note = await createNote({
      projectId: project.id,
      title: "Temporary",
      content: "About to be deleted",
    });

    const backup = await createBackup();

    await deleteNote(note.id);
    expect((await getNotes(project.id)).map((n) => n.id)).not.toContain(
      note.id,
    );

    const result = await restoreBackup(backup, "user_test_owner");
    expect(result.tables.notes).toBeGreaterThan(0);

    const restored = await db.query.notes.findFirst({
      where: eq(notes.id, note.id),
    });
    expect(restored).toBeDefined();
    expect(restored?.title).toBe("Temporary");
    expect(restored?.content).toBe("About to be deleted");
    // Date fields survive the JSON round-trip.
    expect(restored?.createdAt).toBeInstanceOf(Date);

    await deleteProject(project.id);
  });

  it("ignores rows owned by other users", async () => {
    // A foreign project + note are present in the live database…
    await db.insert(projects).values({
      id: "foreign-project",
      userId: "someone-else",
      name: "Foreign",
      slug: "foreign-project",
    });
    await db.insert(notes).values({
      id: "foreign-note",
      projectId: "foreign-project",
      title: "Not yours",
      content: "",
    });

    const backup = await createBackup();

    // …then removed, so only a successful import could bring them back.
    await db.delete(notes).where(eq(notes.id, "foreign-note"));
    await db.delete(projects).where(eq(projects.id, "foreign-project"));

    // Importing as a different user must not carry foreign rows over.
    await restoreBackup(backup, "user_test_owner");

    expect(
      await db.query.projects.findFirst({
        where: eq(projects.id, "foreign-project"),
      }),
    ).toBeUndefined();
    expect(
      await db.query.notes.findFirst({ where: eq(notes.id, "foreign-note") }),
    ).toBeUndefined();
  });
});
