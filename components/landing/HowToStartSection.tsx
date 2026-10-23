"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import { ArrowUpRight, Check, Copy, TriangleAlert } from "lucide-react";
import { cn } from "@/lib/utils";

/** The two supported ways to stand up a local instance. */
type RunModeId = "docker" | "source";

type RunMode = {
  /** Short pill label used in the switcher. */
  label: string;
  /** What the machine needs before the command will run. */
  requirement: string;
  /** Displayed as one terminal line each; copied joined into a single command. */
  lines: string[];
};

/**
 * The run commands are taken verbatim from the repository's own Quick Start
 * and Docker sections, so a visitor can paste them into a terminal and get
 * the same result the README describes.
 */
const RUN_MODES: Record<RunModeId, RunMode> = {
  docker: {
    label: "Docker",
    requirement: "Docker Engine with Compose v2",
    lines: ["docker compose up -d"],
  },
  source: {
    label: "From source",
    requirement: "Node 20.19+ and pnpm 10+",
    lines: [
      "git clone https://github.com/Karelaking/fack-api.git",
      "cd fack-api",
      "pnpm install && pnpm drizzle-kit push && pnpm dev",
    ],
  },
};

const RUN_MODE_ORDER: RunModeId[] = ["docker", "source"];

type CopyState = "idle" | "copied" | "failed";

/**
 * The URL the three steps below add up to: a project slug, an endpoint base
 * path, and a route path, served under the project namespace.
 */
const ROUTE_PARTS: Array<{ role: string; value: string }> = [
  { role: "project", value: "acme-store" },
  { role: "endpoint", value: "User Service · /v1" },
  { role: "route", value: "GET /users" },
];

/**
 * The response schema as the canvas stores it: standard JSON Schema with an
 * `x-faker` extension per field. Nothing proprietary to unlearn.
 */
const SCHEMA_SOURCE = [
  "{",
  '  "type": "object",',
  '  "properties": {',
  '    "id":    { "type": "string", "x-faker": "string.uuid" },',
  '    "name":  { "type": "string", "x-faker": "person.fullName" },',
  '    "email": { "type": "string", "x-faker": "internet.email" }',
  "  }",
  "}",
].join("\n");

/** What the runtime actually answers with, envelope included. */
const RESPONSE_LINES: Array<{ text: string; tone: "payload" | "meta" }> = [
  { text: "{", tone: "payload" },
  { text: '  "data": {', tone: "payload" },
  {
    text: '    "id": "9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d",',
    tone: "payload",
  },
  { text: '    "name": "Jordan Peterson",', tone: "payload" },
  { text: '    "email": "jordan.peterson@example.org"', tone: "payload" },
  { text: "  },", tone: "payload" },
  { text: '  "meta": {', tone: "meta" },
  { text: '    "statusCode": 200,', tone: "meta" },
  { text: '    "success": true,', tone: "meta" },
  { text: '    "latency": 4,', tone: "meta" },
  { text: '    "method": "GET",', tone: "meta" },
  { text: '    "path": "/v1/users"', tone: "meta" },
  { text: "  }", tone: "meta" },
  { text: "}", tone: "payload" },
];

/**
 * Renders one schema line as a short JSON fragment: keys recede, values
 * stay bright, and the `x-faker` keyword and its provider carry the only
 * two colors, so the extension reads as the interesting part of the schema.
 */
const renderSchemaLine = (line: string): React.ReactNode => {
  const parts: React.ReactNode[] = [];
  const pattern =
    /("(?:[^"\\]|\\.)*")(\s*:)?|(\btrue\b|\bfalse\b|\bnull\b)|([{}[\],:])/g;

  let match: RegExpExecArray | null;
  let cursor = 0;
  let expectProvider = false;

  while ((match = pattern.exec(line)) !== null) {
    if (match.index > cursor) {
      parts.push(line.slice(cursor, match.index));
    }
    cursor = pattern.lastIndex;

    const [, string, colon, literal, punctuation] = match;

    if (string !== undefined) {
      if (colon !== undefined) {
        const isProvider = string === '"x-faker"';
        parts.push(
          <span
            key={parts.length}
            className={isProvider ? "text-info" : "text-muted-foreground"}
          >
            {string}
          </span>,
        );
        parts.push(
          <span key={parts.length} className="text-muted-foreground">
            {colon}
          </span>,
        );
        expectProvider = isProvider;
      } else {
        parts.push(
          <span
            key={parts.length}
            className={expectProvider ? "text-success" : "text-foreground"}
          >
            {string}
          </span>,
        );
        expectProvider = false;
      }
    } else if (literal !== undefined) {
      parts.push(
        <span key={parts.length} className="text-muted-foreground">
          {literal}
        </span>,
      );
    } else if (punctuation !== undefined) {
      parts.push(
        <span key={parts.length} className="text-muted-foreground">
          {punctuation}
        </span>,
      );
    }
  }

  if (cursor < line.length) {
    parts.push(line.slice(cursor));
  }

  return parts;
};

/**
 * The landing "how to start" section: four steps from a cold machine to a
 * live mock route.
 *
 * It replaced the earlier "how it works" block, which described the
 * mechanism in the abstract and closed on a metric matrix. This one walks
 * the visitor through the four actions that actually get them a running
 * endpoint, and every artifact on the right is a real command, URL, schema,
 * or response taken from the repository's own README and docs.
 */
export const HowToStartSection = (): React.JSX.Element => {
  const [runMode, setRunMode] = useState<RunModeId>("docker");
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

  const activeMode: RunMode = RUN_MODES[runMode];

  const handleCopy = useCallback(async (): Promise<void> => {
    const command = RUN_MODES[runMode].lines.join(" && ");

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
  }, [runMode]);

  const handleSelect = (id: RunModeId): void => {
    setRunMode(id);
    setCopyState("idle");
  };

  return (
    <section
      id="how-to-start"
      aria-labelledby="how-to-start-title"
      className="border-border/40 bg-background relative w-full overflow-hidden border-b"
    >
      <div className="border-border/40 mx-auto max-w-7xl border-x">
        <header className="px-4 pt-16 pb-12 sm:px-6 sm:pt-20 sm:pb-14 lg:px-8">
          <div className="grid gap-8 lg:grid-cols-[minmax(0,23rem)_minmax(0,1fr)] lg:items-end lg:gap-14">
            <h2
              id="how-to-start-title"
              className="text-foreground max-w-[22ch] text-3xl leading-[1.05] font-extrabold tracking-tight text-balance sm:text-4xl"
            >
              From zero to a live endpoint in four steps.
            </h2>
            <p className="text-muted-foreground max-w-[52ch] text-sm leading-relaxed text-pretty sm:text-base">
              Fack API&apos;s runs on your own machine. Bring it up, name a
              project, map a few fields to Faker providers, then call the route
              over HTTP. No database server to run, no API keys to configure.
            </p>
          </div>
        </header>

        <ol className="border-border/40 divide-border/40 divide-y border-t">
          {/* 01 — Run it locally */}
          <li className="px-4 py-10 sm:px-6 lg:px-8 lg:py-12">
            <div className="grid gap-8 lg:grid-cols-[minmax(0,23rem)_minmax(0,1fr)] lg:items-start lg:gap-14">
              <div>
                <div className="flex items-baseline gap-3">
                  <span className="text-muted-foreground font-mono text-xs tabular-nums">
                    01
                  </span>
                  <h3 className="text-foreground text-lg font-bold tracking-tight">
                    Run it locally
                  </h3>
                </div>
                <p className="text-muted-foreground mt-3 max-w-[46ch] text-sm leading-relaxed">
                  Two ways to bring it up. Docker Compose builds the image and
                  starts the stack; from source runs the app in dev mode. Both
                  end with the server listening on port 3000.
                </p>
              </div>

              <div className="border-border/60 bg-muted/20 overflow-hidden rounded-xl border">
                <div className="border-border/40 bg-muted/40 flex flex-wrap items-center gap-x-4 gap-y-3 border-b px-4 py-2.5">
                  <fieldset className="border-border/40 bg-background/70 m-0 flex min-w-0 gap-0.5 rounded-full border p-1">
                    <legend className="sr-only">
                      Choose how to run Fack API
                    </legend>
                    {RUN_MODE_ORDER.map((id: RunModeId) => {
                      const isActive = id === runMode;
                      return (
                        <button
                          key={id}
                          type="button"
                          aria-pressed={isActive}
                          aria-controls="how-to-start-command"
                          onClick={(): void => handleSelect(id)}
                          className={cn(
                            "inline-flex h-8 cursor-pointer items-center rounded-full px-3.5 text-xs font-bold transition-colors",
                            isActive
                              ? "bg-foreground text-background"
                              : "text-muted-foreground hover:text-foreground",
                          )}
                        >
                          {RUN_MODES[id].label}
                        </button>
                      );
                    })}
                  </fieldset>

                  <span className="text-muted-foreground ml-auto hidden font-mono text-xs sm:inline">
                    {activeMode.requirement}
                  </span>
                </div>

                <div
                  id="how-to-start-command"
                  className="bg-background/40 flex items-start justify-between gap-4 px-4 py-4"
                >
                  <div className="min-w-0 font-mono text-xs leading-relaxed">
                    {activeMode.lines.map((line: string) => (
                      <div key={line} className="flex gap-2.5">
                        <span
                          className="text-muted-foreground shrink-0 select-none"
                          aria-hidden="true"
                        >
                          $
                        </span>
                        <code className="text-foreground break-words">
                          {line}
                        </code>
                      </div>
                    ))}
                  </div>

                  <button
                    type="button"
                    onClick={(): void => {
                      void handleCopy();
                    }}
                    aria-label="Copy the start command to the clipboard"
                    className="border-border/60 bg-background text-foreground hover:bg-muted inline-flex h-9 shrink-0 cursor-pointer items-center gap-1.5 rounded-full border px-3.5 text-xs font-bold transition-colors"
                  >
                    {copyState === "copied" ? (
                      <>
                        <Check
                          className="text-success size-3.5"
                          aria-hidden="true"
                        />
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

                <div className="border-border/40 bg-muted/20 flex flex-wrap items-center gap-x-2 gap-y-1 border-t px-4 py-2.5">
                  <span className="text-foreground font-mono text-xs font-semibold">
                    http://localhost:3000
                  </span>
                  <span aria-hidden="true" className="text-muted-foreground">
                    ·
                  </span>
                  <span className="text-muted-foreground text-xs">
                    the dashboard opens here
                  </span>
                </div>
              </div>
            </div>
          </li>

          {/* 02 — Name a project */}
          <li className="px-4 py-10 sm:px-6 lg:px-8 lg:py-12">
            <div className="grid gap-8 lg:grid-cols-[minmax(0,23rem)_minmax(0,1fr)] lg:items-start lg:gap-14">
              <div>
                <div className="flex items-baseline gap-3">
                  <span className="text-muted-foreground font-mono text-xs tabular-nums">
                    02
                  </span>
                  <h3 className="text-foreground text-lg font-bold tracking-tight">
                    Name a project
                  </h3>
                </div>
                <p className="text-muted-foreground mt-3 max-w-[46ch] text-sm leading-relaxed">
                  A project owns its endpoints, and its slug is the first
                  segment of every mock URL it serves. Endpoints carry a base
                  path; routes hang off them.
                </p>
              </div>

              <div className="border-border/60 bg-muted/20 overflow-hidden rounded-xl border">
                <div className="border-border/40 bg-muted/40 flex items-center justify-between gap-3 border-b px-4 py-2.5">
                  <span className="text-muted-foreground font-mono text-xs">
                    http://localhost:3000
                  </span>
                  <span className="border-method-get/30 bg-method-get/15 text-method-get shrink-0 rounded border px-1.5 py-0.5 font-mono text-xs font-bold">
                    GET
                  </span>
                </div>

                <dl className="divide-border/40 divide-y">
                  {ROUTE_PARTS.map((part: { role: string; value: string }) => (
                    <div
                      key={part.role}
                      className="flex items-center justify-between gap-4 px-4 py-2.5 font-mono text-xs"
                    >
                      <dt className="text-muted-foreground">{part.role}</dt>
                      <dd className="text-foreground truncate">{part.value}</dd>
                    </div>
                  ))}
                </dl>

                <div className="border-border/40 bg-background/40 flex flex-wrap items-center justify-between gap-x-4 gap-y-1 border-t px-4 py-3">
                  <span className="text-muted-foreground text-xs">
                    served at
                  </span>
                  <code className="text-foreground font-mono text-xs font-semibold break-words">
                    /acme-store/v1/users
                  </code>
                </div>
              </div>
            </div>
          </li>

          {/* 03 — Attach a schema */}
          <li className="px-4 py-10 sm:px-6 lg:px-8 lg:py-12">
            <div className="grid gap-8 lg:grid-cols-[minmax(0,23rem)_minmax(0,1fr)] lg:items-start lg:gap-14">
              <div>
                <div className="flex items-baseline gap-3">
                  <span className="text-muted-foreground font-mono text-xs tabular-nums">
                    03
                  </span>
                  <h3 className="text-foreground text-lg font-bold tracking-tight">
                    Attach a schema
                  </h3>
                </div>
                <p className="text-muted-foreground mt-3 max-w-[46ch] text-sm leading-relaxed">
                  Pick a provider for each field on the canvas. The result is
                  stored as standard JSON Schema with an{" "}
                  <code className="text-info font-mono text-xs">x-faker</code>{" "}
                  extension, so the contract stays portable to any tool.
                </p>
              </div>

              <div className="border-border/60 bg-muted/20 overflow-hidden rounded-xl border">
                <div className="border-border/40 bg-muted/40 flex items-center justify-between gap-3 border-b px-4 py-2.5">
                  <span className="text-muted-foreground font-mono text-xs">
                    response schema
                  </span>
                  <span className="text-muted-foreground font-mono text-xs">
                    JSON Schema
                  </span>
                </div>

                <pre className="scrollbar-subtle overflow-x-auto px-4 py-3.5 font-mono text-[11px] leading-relaxed sm:text-xs">
                  <code className="text-foreground">
                    {SCHEMA_SOURCE.split("\n").map(
                      (line: string, index: number) => (
                        <span key={index} className="block">
                          {renderSchemaLine(line)}
                        </span>
                      ),
                    )}
                  </code>
                </pre>
              </div>
            </div>
          </li>

          {/* 04 — Call it */}
          <li className="px-4 py-10 sm:px-6 lg:px-8 lg:py-12">
            <div className="grid gap-8 lg:grid-cols-[minmax(0,23rem)_minmax(0,1fr)] lg:items-start lg:gap-14">
              <div>
                <div className="flex items-baseline gap-3">
                  <span className="text-muted-foreground font-mono text-xs tabular-nums">
                    04
                  </span>
                  <h3 className="text-foreground text-lg font-bold tracking-tight">
                    Call the route
                  </h3>
                </div>
                <p className="text-muted-foreground mt-3 max-w-[46ch] text-sm leading-relaxed">
                  The route answers as soon as you save it. Point your app at
                  the URL, or check it from the terminal — the payload is
                  generated per request, not stored.
                </p>
              </div>

              <div className="border-border/60 bg-muted/20 overflow-hidden rounded-xl border">
                <div className="border-border/40 bg-muted/40 flex items-center justify-between gap-3 border-b px-4 py-2.5">
                  <span className="text-muted-foreground font-mono text-xs">
                    terminal
                  </span>
                  <span className="border-success/30 bg-success/10 text-success shrink-0 rounded border px-1.5 py-0.5 font-mono text-xs font-bold">
                    200 OK
                  </span>
                </div>

                <div className="bg-background/40 flex gap-2.5 px-4 py-3 font-mono text-xs">
                  <span
                    className="text-muted-foreground shrink-0 select-none"
                    aria-hidden="true"
                  >
                    $
                  </span>
                  <code className="text-foreground break-words">
                    curl http://localhost:3000/acme-store/v1/users
                  </code>
                </div>

                <pre className="scrollbar-subtle border-border/40 overflow-x-auto border-t px-4 py-3 font-mono text-[11px] leading-relaxed sm:text-xs">
                  {RESPONSE_LINES.map(
                    (line: { text: string; tone: string }) => (
                      <span
                        key={line.text}
                        className={cn(
                          "block",
                          line.tone === "payload"
                            ? "text-foreground"
                            : "text-muted-foreground",
                        )}
                      >
                        {line.text}
                      </span>
                    ),
                  )}
                </pre>
              </div>
            </div>
          </li>
        </ol>

        {/* Close: where to read further, and what the setup guarantees. */}
        <div className="border-border/40 flex flex-col gap-8 border-t px-4 py-9 sm:px-6 lg:flex-row lg:items-center lg:justify-between lg:gap-10 lg:px-8 lg:py-10">
          <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-center">
            <div>
              <p className="text-foreground text-sm font-semibold">
                The full walkthrough is in the docs.
              </p>
              <p className="text-muted-foreground mt-1 max-w-[46ch] text-xs leading-relaxed">
                Every dialog, step by step, plus chaos rules, scenarios, and the
                TypeScript export.
              </p>
            </div>
            <a
              href="https://github.com/Karelaking/fack-api/blob/main/docs/content/docs/getting-started/quickstart.mdx"
              target="_blank"
              rel="noopener noreferrer"
              className="group border-border/60 text-foreground hover:bg-muted inline-flex h-11 shrink-0 items-center gap-2 rounded-full border px-5 text-sm font-semibold transition-colors"
            >
              Read the walkthrough
              <ArrowUpRight
                className="size-4 transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
                aria-hidden="true"
              />
            </a>
          </div>

          <p className="text-foreground font-mono text-xs tracking-[0.14em] uppercase lg:text-right">
            Nothing leaves your machine
            <span className="text-muted-foreground mt-1 block">
              Local SQLite storage · MIT licensed
            </span>
          </p>
        </div>

        <p aria-live="polite" className="sr-only">
          {copyState === "copied"
            ? "Start command copied to the clipboard"
            : copyState === "failed"
              ? "Copy failed. Select the command and copy it manually."
              : ""}
        </p>
      </div>
    </section>
  );
};
