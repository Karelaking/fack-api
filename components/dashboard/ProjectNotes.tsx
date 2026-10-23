"use client";

import * as React from "react";
import { toast } from "sonner";
import {
  RiAddLine,
  RiDeleteBin6Line,
  RiLoader2Line,
  RiPushpinLine,
  RiStickyNoteLine,
} from "@remixicon/react";
import { createNote, deleteNote, updateNote } from "@/lib/actions/notes";
import type { Note } from "@/db/schema";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent } from "@/components/ui/card";

interface ProjectNotesProps {
  projectId: string;
  projectSlug: string;
  initialNotes: Note[];
}

type NotePatch = Partial<Pick<Note, "title" | "content" | "pinned">>;

function sortNotes(list: Note[]): Note[] {
  return [...list].sort(
    (a, b) =>
      Number(b.pinned) - Number(a.pinned) ||
      b.updatedAt.getTime() - a.updatedAt.getTime(),
  );
}

function displayTitle(note: Note): string {
  return note.title.trim() || "Untitled note";
}

/**
 * Project scratchpad.
 *
 * Notes are persisted through the standard data layer, so they live in the
 * private local database when the app runs without API keys and in the remote
 * database when keys are configured — no storage toggle needed here.
 */
export function ProjectNotes({
  projectId,
  initialNotes,
}: ProjectNotesProps): React.JSX.Element {
  const [notes, setNotes] = React.useState<Note[]>(initialNotes);
  const [selectedId, setSelectedId] = React.useState<string | null>(
    initialNotes[0]?.id ?? null,
  );
  const [creating, setCreating] = React.useState(false);
  const [confirmId, setConfirmId] = React.useState<string | null>(null);
  const [saveState, setSaveState] = React.useState<"idle" | "saving" | "saved">(
    "idle",
  );

  // Dirty-field queue: only the fields the user touched are sent to the server.
  const pendingRef = React.useRef(new Map<string, NotePatch>());
  const timerRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  const flush = React.useCallback(async () => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }

    const entries = Array.from(pendingRef.current.entries());
    if (entries.length === 0) return;

    for (const [id] of entries) pendingRef.current.delete(id);
    setSaveState("saving");

    try {
      for (const [id, patch] of entries) {
        await updateNote({ id, ...patch });
      }
      setSaveState("saved");
    } catch (error) {
      // Re-queue everything that did not make it so no edit is lost.
      for (let i = 0; i < entries.length; i++) {
        const [id, patch] = entries[i];
        if (!pendingRef.current.has(id)) pendingRef.current.set(id, patch);
      }
      setSaveState("idle");
      toast.error("Couldn't save note", {
        description: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }, []);

  const scheduleSave = React.useCallback(
    (id: string, patch: NotePatch) => {
      const existing = pendingRef.current.get(id);
      pendingRef.current.set(id, existing ? { ...existing, ...patch } : patch);
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => {
        void flush();
      }, 800);
    },
    [flush],
  );

  // Never lose in-flight edits when the user navigates away.
  React.useEffect(() => {
    return () => {
      void flush();
    };
  }, [flush]);

  const selected = notes.find((note) => note.id === selectedId) ?? null;

  function handlePatch(id: string, patch: NotePatch) {
    setNotes((prev) =>
      sortNotes(
        prev.map((note) =>
          note.id === id ? { ...note, ...patch, updatedAt: new Date() } : note,
        ),
      ),
    );
    scheduleSave(id, patch);
  }

  async function handleCreate(): Promise<void> {
    if (creating) return;
    setCreating(true);
    try {
      const note = await createNote({ projectId, title: "", content: "" });
      setNotes((prev) => sortNotes([note, ...prev]));
      setSelectedId(note.id);
      setConfirmId(null);
    } catch (error) {
      toast.error("Couldn't create note", {
        description: error instanceof Error ? error.message : "Unknown error",
      });
    } finally {
      setCreating(false);
    }
  }

  async function handleDelete(id: string): Promise<void> {
    if (confirmId !== id) {
      setConfirmId(id);
      return;
    }
    try {
      pendingRef.current.delete(id);
      await deleteNote(id);
      const remaining = notes.filter((note) => note.id !== id);
      setNotes(remaining);
      if (selectedId === id) {
        setSelectedId(remaining[0]?.id ?? null);
      }
      setConfirmId(null);
      toast.success("Note deleted");
    } catch (error) {
      toast.error("Couldn't delete note", {
        description: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }

  return (
    <div className="flex h-full w-full flex-col gap-4 p-4 md:p-6 lg:flex-row">
      {/* ─── Note list ─────────────────────────────────────────────────── */}
      <aside className="flex w-full shrink-0 flex-col lg:w-80">
        <div className="mb-3 flex items-center justify-between gap-2">
          <div>
            <h1 className="text-lg font-semibold tracking-tight">Notes</h1>
            <p className="text-muted-foreground text-xs">
              {notes.length === 0
                ? "No notes yet"
                : `${notes.length} note${notes.length === 1 ? "" : "s"}`}
            </p>
          </div>
          <Button
            size="sm"
            onClick={() => void handleCreate()}
            disabled={creating}
          >
            {creating ? (
              <RiLoader2Line className="animate-spin" aria-hidden="true" />
            ) : (
              <RiAddLine aria-hidden="true" />
            )}
            New note
          </Button>
        </div>

        <div className="flex min-h-0 flex-1 flex-col gap-1.5 overflow-y-auto">
          {notes.length === 0 && (
            <div className="border-border/50 text-muted-foreground flex flex-col items-center gap-3 rounded-xl border border-dashed p-6 text-center">
              <RiStickyNoteLine className="h-6 w-6" aria-hidden="true" />
              <p className="text-sm">
                Capture decisions, todos, and API reminders here. Notes are
                stored with the rest of your project data.
              </p>
              <Button
                variant="outline"
                size="sm"
                onClick={() => void handleCreate()}
              >
                Create your first note
              </Button>
            </div>
          )}

          {notes.map((note) => (
            <button
              key={note.id}
              type="button"
              onClick={() => {
                setSelectedId(note.id);
                setConfirmId(null);
              }}
              className={cn(
                "rounded-lg border px-3 py-2.5 text-left transition-colors",
                note.id === selectedId
                  ? "border-primary/40 bg-primary/5"
                  : "border-border/50 bg-card hover:bg-accent/50",
              )}
            >
              <span className="flex items-center gap-1.5">
                {note.pinned && (
                  <RiPushpinLine
                    className="text-primary h-3.5 w-3.5 shrink-0"
                    aria-hidden="true"
                  />
                )}
                <span className="truncate text-sm font-medium">
                  {displayTitle(note)}
                </span>
              </span>
              <span className="text-muted-foreground mt-0.5 block truncate text-xs">
                {note.content.trim().split("\n")[0] || "Empty note"}
              </span>
            </button>
          ))}
        </div>
      </aside>

      {/* ─── Editor ────────────────────────────────────────────────────── */}
      <section className="min-w-0 flex-1">
        {selected ? (
          <Card className="flex h-full flex-col">
            <CardContent className="flex h-full flex-col gap-3 p-4 md:p-5">
              <div className="flex items-center gap-2">
                <Input
                  value={selected.title}
                  onChange={(event) =>
                    handlePatch(selected.id, { title: event.target.value })
                  }
                  placeholder="Note title"
                  aria-label="Note title"
                  className="h-9 border-none px-1 text-base font-semibold shadow-none focus-visible:ring-0 md:text-base"
                />
                <div className="flex shrink-0 items-center gap-1.5">
                  <RiPushpinLine
                    className={cn(
                      "h-4 w-4",
                      selected.pinned
                        ? "text-primary"
                        : "text-muted-foreground",
                    )}
                    aria-hidden="true"
                  />
                  <Switch
                    checked={selected.pinned}
                    onCheckedChange={(checked) =>
                      handlePatch(selected.id, { pinned: checked })
                    }
                    aria-label="Pin note"
                  />
                </div>
              </div>

              <Textarea
                value={selected.content}
                onChange={(event) =>
                  handlePatch(selected.id, { content: event.target.value })
                }
                placeholder="Start writing…"
                aria-label="Note content"
                className="min-h-[50vh] flex-1 resize-none"
              />

              <div className="flex items-center justify-between gap-2">
                <span className="text-muted-foreground text-xs">
                  {saveState === "saving"
                    ? "Saving…"
                    : saveState === "saved"
                      ? "Saved"
                      : "Auto-saves as you type"}
                </span>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => void flush()}
                  >
                    Save now
                  </Button>
                  <Button
                    variant={
                      confirmId === selected.id ? "destructive" : "ghost"
                    }
                    size="sm"
                    onClick={() => void handleDelete(selected.id)}
                  >
                    <RiDeleteBin6Line aria-hidden="true" />
                    {confirmId === selected.id ? "Confirm delete" : "Delete"}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card className="flex h-full items-center justify-center">
            <CardContent className="text-muted-foreground flex flex-col items-center gap-3 p-10 text-center">
              <RiStickyNoteLine className="h-7 w-7" aria-hidden="true" />
              <p className="text-sm">
                Select a note from the list or create a new one.
              </p>
              <Button
                variant="outline"
                size="sm"
                onClick={() => void handleCreate()}
              >
                <RiAddLine aria-hidden="true" />
                New note
              </Button>
            </CardContent>
          </Card>
        )}
      </section>
    </div>
  );
}
