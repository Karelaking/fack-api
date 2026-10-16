"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import { Check, Copy, TriangleAlert } from "lucide-react";
import { cn } from "@/lib/utils";

export type QuickStartId = "docker" | "source";

export type QuickStartOption = {
  /** Short pill label used in the switcher. */
  label: string;
  /** One-line requirement shown beside the switcher on wide screens. */
  hint: string;
  /** Displayed as one terminal line each; copied joined into a single command. */
  lines: string[];
};

/**
 * The two supported ways to stand up a local instance, taken from the
 * repository's own Quick Start section so the copy matches the docs verbatim.
 */
export const QUICKSTART_OPTIONS: Record<QuickStartId, QuickStartOption> = {
  docker: {
    label: "Docker",
    hint: "Docker Engine with Compose v2",
    lines: ["docker compose up -d"],
  },
  source: {
    label: "From source",
    hint: "Node 20.19+ and pnpm 10+",
    lines: [
      "git clone https://github.com/Karelaking/fack-api.git",
      "cd fack-api",
      "pnpm install && pnpm drizzle-kit push && pnpm dev",
    ],
  },
};

const QUICKSTART_ORDER: QuickStartId[] = ["docker", "source"];

type CopyState = "idle" | "copied" | "failed";

export type QuickStartBarProps = {
  className?: string;
};

/**
 * Copyable quick-start switch for the hero: the two commands a self-hoster can
 * actually run, with a clipboard write that reports its real outcome instead of
 * assuming success.
 */
export const QuickStartBar = ({
  className = "",
}: QuickStartBarProps): React.JSX.Element => {
  const [activeId, setActiveId] = useState<QuickStartId>("docker");
  const [copyState, setCopyState] = useState<CopyState>("idle");
  const resetTimerRef = useRef<ReturnType<typeof setTimeout> | undefined>(
    undefined,
  );

  useEffect((): (() => void) => {
    return (): void => {
      if (resetTimerRef.current !== undefined) {
        clearTimeout(resetTimerRef.current);
      }
    };
  }, []);

  const activeOption: QuickStartOption = QUICKSTART_OPTIONS[activeId];

  const handleCopy = useCallback(async (): Promise<void> => {
    const command = QUICKSTART_OPTIONS[activeId].lines.join(" && ");

    try {
      await navigator.clipboard.writeText(command);
      setCopyState("copied");
    } catch {
      setCopyState("failed");
    }

    if (resetTimerRef.current !== undefined) {
      clearTimeout(resetTimerRef.current);
    }
    resetTimerRef.current = setTimeout((): void => setCopyState("idle"), 2400);
  }, [activeId]);

  const handleSelect = (id: QuickStartId): void => {
    setActiveId(id);
    setCopyState("idle");
  };

  return (
    <div
      className={cn(
        "border-border/60 bg-muted/20 overflow-hidden rounded-2xl border shadow-lg shadow-black/5",
        className,
      )}
    >
      <div className="border-border/40 bg-muted/40 flex flex-wrap items-center gap-x-3 gap-y-2 border-b px-3 py-2">
        <fieldset className="border-border/40 bg-background/70 m-0 flex min-w-0 gap-0.5 rounded-full border p-1">
          <legend className="sr-only">Choose how to run Fack API</legend>
          {QUICKSTART_ORDER.map((id: QuickStartId) => {
            const isActive = id === activeId;
            return (
              <button
                key={id}
                type="button"
                aria-pressed={isActive}
                aria-controls="hero-quickstart-command"
                onClick={(): void => handleSelect(id)}
                className={cn(
                  "inline-flex h-9 cursor-pointer items-center rounded-full px-3.5 text-caption font-bold transition-colors",
                  isActive
                    ? "bg-foreground text-background"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                {QUICKSTART_OPTIONS[id].label}
              </button>
            );
          })}
        </fieldset>

        <span className="text-muted-foreground text-caption hidden font-mono sm:inline">
          {activeOption.hint}
        </span>

        <button
          type="button"
          onClick={(): void => {
            void handleCopy();
          }}
          aria-label="Copy start command to clipboard"
          className="border-border/60 bg-background text-foreground hover:bg-muted text-caption ml-auto inline-flex h-10 shrink-0 cursor-pointer items-center gap-1.5 rounded-full border px-3.5 font-bold transition-colors"
        >
          {copyState === "copied" ? (
            <>
              <Check className="text-success size-3.5" aria-hidden="true" />
              <span>Copied</span>
            </>
          ) : copyState === "failed" ? (
            <>
              <TriangleAlert
                className="text-destructive size-3.5"
                aria-hidden="true"
              />
              <span>Copy manually</span>
            </>
          ) : (
            <>
              <Copy className="size-3.5" aria-hidden="true" />
              <span>Copy</span>
            </>
          )}
        </button>
      </div>

      <div
        id="hero-quickstart-command"
        className="bg-background/40 px-4 py-3.5 font-mono text-xs leading-relaxed"
      >
        {activeOption.lines.map((line: string, index: number) => (
          <div key={line} className="flex gap-2">
            <span
              className="text-muted-foreground/60 shrink-0 select-none"
              aria-hidden="true"
            >
              {index === 0 ? "$" : ">"}
            </span>
            <code className="text-foreground break-all">{line}</code>
          </div>
        ))}
      </div>

      <div className="border-border/40 bg-muted/20 text-muted-foreground text-caption flex flex-wrap items-center gap-x-2 gap-y-1 border-t px-4 py-2">
        <span className="text-foreground font-semibold">
          http://localhost:3000
        </span>
        <span aria-hidden="true">·</span>
        <span>one SQLite file, no database server to run</span>
        <span aria-hidden="true">·</span>
        <span>MIT licensed</span>
      </div>

      <p aria-live="polite" className="sr-only">
        {copyState === "copied"
          ? "Command copied to clipboard"
          : copyState === "failed"
            ? "Copy failed. Select the command and copy it manually."
            : ""}
      </p>
    </div>
  );
};
