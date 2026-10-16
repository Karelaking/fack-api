"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  RiSparkling2Fill,
  RiCloseLine,
  RiArrowUpLine,
  RiLoader2Line,
  RiCheckboxCircleFill,
  RiErrorWarningFill,
  RiTimeLine,
  RiStopCircleLine,
  RiArrowGoBackLine,
  RiFileTextLine,
} from "@remixicon/react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { useAgentActions, useAgentStore } from "@/stores/agent-store-provider";
import { OPEN_AGENT_COMPOSER_EVENT } from "@/lib/ai/agent-events";
import { ApiChangeSetPreview } from "./ApiChangeSetPreview";
import { ConflictResolutionDialog } from "./ConflictResolutionDialog";
import type { GenerationProgressStep } from "@/lib/ai/types";

const PROMPT_SUGGESTIONS = [
  {
    label: "E-commerce",
    prompt:
      "Create an e-commerce API with products, categories, a customer cart, and orders.",
  },
  {
    label: "Social feed",
    prompt:
      "Create a social API with user profiles, feed posts, comments, likes, and follows.",
  },
  {
    label: "Food delivery",
    prompt:
      "Create a food delivery API with restaurants, menus, carts, and delivery tracking.",
  },
  {
    label: "Authentication",
    prompt:
      "Add authentication APIs with register, login, session refresh, and profile endpoints.",
  },
];

function stepIcon(status: GenerationProgressStep["status"]): React.ReactNode {
  switch (status) {
    case "completed":
      return (
        <RiCheckboxCircleFill className="text-success size-3.5 shrink-0" />
      );
    case "active":
      return (
        <RiLoader2Line className="text-primary size-3.5 shrink-0 animate-spin motion-reduce:animate-none" />
      );
    case "failed":
      return (
        <RiErrorWarningFill className="text-destructive size-3.5 shrink-0" />
      );
    default:
      return (
        <RiTimeLine className="text-muted-foreground/60 size-3.5 shrink-0" />
      );
  }
}

/**
 * Floating agent composer docked over the canvas.
 *
 * Generation no longer opens a modal: the composer collapses to a pill while
 * the canvas stays visible, streams the phase timeline in place, and hands the
 * resulting drafts to the canvas for preview.
 */
export function AgentComposer(): React.JSX.Element {
  const router = useRouter();
  const actions = useAgentActions();

  const status = useAgentStore((state) => state.status);
  const prompt = useAgentStore((state) => state.prompt);
  const steps = useAgentStore((state) => state.steps);
  const startedAt = useAgentStore((state) => state.startedAt);
  const result = useAgentStore((state) => state.result);
  const error = useAgentStore((state) => state.error);
  const errorPhase = useAgentStore((state) => state.errorPhase);
  const resolutions = useAgentStore((state) => state.resolutions);
  const applied = useAgentStore((state) => state.applied);

  const [manualOpen, setManualOpen] = React.useState(false);
  const [collapsedKey, setCollapsedKey] = React.useState<string | null>(null);
  const [showSpec, setShowSpec] = React.useState(false);
  const [clock, setClock] = React.useState<{
    startedAt: number;
    elapsedMs: number;
  } | null>(null);

  const isRunning = status === "running";
  const isApplying = status === "applying";
  const changeSet = result?.changeSet ?? null;
  const conflicts = changeSet?.conflicts ?? [];

  // The composer opens itself whenever there is something to show, and stays
  // collapsed only while that same outcome is dismissed by the user.
  const outcomeKey = isRunning
    ? `running:${startedAt ?? 0}`
    : result
      ? `ready:${result.proposalId ?? "draft"}`
      : error
        ? `error:${errorPhase ?? "generate"}`
        : null;

  const expanded =
    outcomeKey !== null && collapsedKey !== outcomeKey ? true : manualOpen;

  const elapsedSeconds =
    clock && clock.startedAt === startedAt ? clock.elapsedMs / 1000 : 0;

  // The clock only advances from the interval callback, so rendering stays pure.
  React.useEffect(() => {
    if (!isRunning || !startedAt) return;

    const timer = window.setInterval(() => {
      setClock({ startedAt, elapsedMs: Date.now() - startedAt });
    }, 500);
    return () => window.clearInterval(timer);
  }, [isRunning, startedAt]);

  // The header "AI Architect" action opens the composer instead of a dialog.
  React.useEffect(() => {
    const handleOpen = () => {
      setManualOpen(true);
    };
    window.addEventListener(OPEN_AGENT_COMPOSER_EVENT, handleOpen);
    return () =>
      window.removeEventListener(OPEN_AGENT_COMPOSER_EVENT, handleOpen);
  }, []);

  // Applying resets the session in the store, so the panel derives its way back
  // to the prompt once the canvas has been refreshed.
  React.useEffect(() => {
    if (!applied) return;
    toast.success(
      `Applied ${applied.created.routes} routes across ${applied.created.endpoints} endpoints`,
    );
    router.refresh();
  }, [applied, router]);

  const handleCollapse = () => {
    setManualOpen(false);
    if (outcomeKey !== null) {
      setCollapsedKey(outcomeKey);
    }
  };

  const handleRun = () => {
    void actions.startRun();
  };

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    handleRun();
  };

  const changeCount = changeSet
    ? changeSet.summary.endpointsCount + changeSet.summary.routesCount
    : 0;

  if (!expanded) {
    return (
      <div className="pointer-events-none absolute inset-x-0 bottom-0 z-20 flex justify-center p-3">
        <button
          type="button"
          onClick={() => setManualOpen(true)}
          className={cn(
            "bg-card/95 border-border/60 pointer-events-auto flex items-center gap-2 rounded-full border px-4 py-2.5 text-sm shadow-lg backdrop-blur transition-colors",
            "hover:border-primary/40 hover:text-primary",
          )}
        >
          <RiSparkling2Fill className="text-primary size-4 shrink-0" />
          <span className="font-medium">
            {isRunning
              ? "Agent is working…"
              : "Ask the architect to build your API"}
          </span>
        </button>
      </div>
    );
  }

  return (
    <div className="pointer-events-none absolute inset-x-0 bottom-0 z-20 flex justify-center p-3">
      <div className="bg-card/95 border-border/60 pointer-events-auto flex max-h-[70%] w-full max-w-3xl flex-col gap-3 overflow-y-auto rounded-2xl border p-3 shadow-2xl backdrop-blur">
        <header className="flex items-center justify-between gap-2">
          <div className="flex min-w-0 items-center gap-2">
            <RiSparkling2Fill className="text-primary size-4 shrink-0" />
            <span className="truncate text-sm font-semibold">
              API Architect
            </span>
            {isRunning ? (
              <span className="text-muted-foreground text-xs tabular-nums">
                {elapsedSeconds.toFixed(1)}s
              </span>
            ) : null}
          </div>
          <div className="flex items-center gap-1">
            {isRunning ? (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => actions.cancel()}
              >
                <RiStopCircleLine className="size-3.5" />
                Stop
              </Button>
            ) : null}
            <Button
              type="button"
              variant="ghost"
              size="sm"
              aria-label="Collapse agent composer"
              onClick={handleCollapse}
            >
              <RiCloseLine className="size-4" />
            </Button>
          </div>
        </header>

        {/* Live phase timeline — the agent's work, streamed onto the canvas. */}
        {isRunning || (status === "ready" && steps.length > 0) ? (
          <ol aria-live="polite" className="flex flex-col gap-1.5">
            {steps.map((step) => (
              <li key={step.id} className="flex items-start gap-2">
                <span className="mt-0.5">{stepIcon(step.status)}</span>
                <span className="flex min-w-0 flex-col">
                  <span
                    className={cn(
                      "truncate text-xs",
                      step.status === "completed" &&
                        "text-muted-foreground line-through decoration-transparent",
                      step.status === "active" && "text-foreground font-medium",
                      step.status === "pending" && "text-muted-foreground/60",
                      step.status === "failed" && "text-destructive",
                    )}
                  >
                    {step.label}
                  </span>
                  {step.detail ? (
                    <span className="text-muted-foreground/70 truncate text-[11px]">
                      {step.detail}
                    </span>
                  ) : null}
                </span>
              </li>
            ))}
          </ol>
        ) : null}

        {/* Persistent, retryable failure state. */}
        {error ? (
          <div className="border-destructive/30 bg-destructive/5 flex flex-col gap-2 rounded-xl border p-3">
            <div className="text-destructive flex items-center gap-2">
              <RiErrorWarningFill className="size-4 shrink-0" />
              <span className="text-xs font-semibold tracking-wider uppercase">
                {errorPhase === "apply"
                  ? "Could not apply the changes"
                  : "The agent could not finish"}
              </span>
            </div>
            <p className="text-muted-foreground text-xs">{error}</p>
            <div className="flex items-center gap-2">
              <Button
                type="button"
                size="sm"
                onClick={() => void actions.retry()}
              >
                <RiArrowGoBackLine className="size-3.5" />
                Retry
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => actions.reset()}
              >
                Dismiss
              </Button>
            </div>
          </div>
        ) : null}

        {/* Review + apply, once the drafts are on the canvas. */}
        {changeSet ? (
          <div className="flex flex-col gap-3">
            <div className="flex flex-wrap items-center gap-2">
              <span className="border-primary/30 bg-primary/10 text-primary rounded-full border px-2.5 py-1 text-xs font-medium">
                {changeSet.summary.endpointsCount} endpoints
              </span>
              <span className="border-primary/30 bg-primary/10 text-primary rounded-full border px-2.5 py-1 text-xs font-medium">
                {changeSet.summary.routesCount} routes
              </span>
              <span className="border-border/60 bg-muted/40 text-muted-foreground rounded-full border px-2.5 py-1 text-xs font-medium">
                {changeSet.summary.fieldsCount} fields
              </span>
              {conflicts.length > 0 ? (
                <span className="border-warning/40 bg-warning/10 text-warning rounded-full border px-2.5 py-1 text-xs font-medium">
                  {conflicts.length} conflicts
                </span>
              ) : null}
            </div>

            <ConflictResolutionDialog
              conflicts={conflicts}
              resolutions={resolutions}
              onResolutionChange={actions.setResolution}
            />

            <div className="flex flex-wrap items-center gap-2">
              <Button
                type="button"
                size="sm"
                disabled={isApplying}
                onClick={() => void actions.applyChanges()}
              >
                {isApplying ? (
                  <RiLoader2Line className="size-3.5 animate-spin motion-reduce:animate-none" />
                ) : null}
                Apply {changeCount} changes
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setShowSpec((previous) => !previous)}
              >
                <RiFileTextLine className="size-3.5" />
                {showSpec ? "Hide" : "View"} specification
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => {
                  actions.reset();
                  setShowSpec(false);
                }}
              >
                Discard
              </Button>
            </div>

            {showSpec && result?.generation ? (
              <div className="border-border/60 rounded-xl border p-3">
                <ApiChangeSetPreview
                  api={result.generation}
                  changeSet={changeSet}
                  detailedPrompt={result.detailedPrompt}
                  detailedSummary={result.detailedSummary}
                />
              </div>
            ) : null}
          </div>
        ) : null}

        {/* Prompt entry — always available. */}
        {!changeSet ? (
          <form onSubmit={handleSubmit} className="flex flex-col gap-2">
            <Textarea
              value={prompt}
              onChange={(event) => actions.setPrompt(event.target.value)}
              placeholder="Describe the API you want, e.g. “an events platform with organizers, venues and ticket orders”."
              rows={3}
              disabled={isRunning}
              className="resize-none"
            />
            <div className="flex flex-wrap items-center gap-2">
              <Button
                type="submit"
                size="sm"
                disabled={isRunning || !prompt.trim()}
              >
                {isRunning ? (
                  <RiLoader2Line className="size-3.5 animate-spin motion-reduce:animate-none" />
                ) : (
                  <RiArrowUpLine className="size-3.5" />
                )}
                Generate
              </Button>
              {PROMPT_SUGGESTIONS.map((suggestion) => (
                <button
                  key={suggestion.label}
                  type="button"
                  disabled={isRunning}
                  onClick={() => actions.setPrompt(suggestion.prompt)}
                  className="border-border/60 bg-muted/40 text-muted-foreground hover:border-primary/40 hover:text-primary rounded-full border px-2.5 py-1 text-xs transition-colors disabled:opacity-50"
                >
                  {suggestion.label}
                </button>
              ))}
            </div>
          </form>
        ) : null}
      </div>
    </div>
  );
}

export default AgentComposer;
