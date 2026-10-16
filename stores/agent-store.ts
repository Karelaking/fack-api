/**
 * Fack AI API Architect — Agent Session Store
 *
 * Owns the lifetime of a single "ask the architect to build this API" run:
 * the prompt, the streamed phase timeline, the generated change set, the
 * per-conflict resolutions, and the apply step.
 *
 * The store is deliberately framework-light — a vanilla zustand store created
 * per project by `AgentStoreProvider` — so the canvas and the composer can both
 * subscribe to selections without prop drilling.
 */

import { createStore, type StoreApi } from "zustand";
import type {
  ApplyApiResponse,
  GenerateApiResponse,
  GenerationProgressStep,
} from "@/lib/types/ai.type";
import {
  AgentGenerationError,
  streamApiGeneration,
  type AgentStreamEvent,
} from "@/lib/ai/agent-client";

export type AgentStatus = "idle" | "running" | "ready" | "applying" | "error";

export type ConflictResolution = "replace" | "skip" | "modify";

export type AgentErrorPhase = "generate" | "apply";

/** The six phases the server reports; the client mirrors them as pending rows. */
export const AGENT_STEP_TEMPLATE: readonly Omit<
  GenerationProgressStep,
  "status"
>[] = [
  { id: "understanding", label: "Analyzing requirements & domain scope" },
  { id: "inspecting", label: "Inspecting the current project" },
  { id: "expanding_prompt", label: "Expanding the prompt into a plan" },
  { id: "designing", label: "Designing endpoints, routes & schemas" },
  { id: "validating", label: "Validating response schemas" },
  { id: "checking_conflicts", label: "Checking for route conflicts" },
];

function createPendingSteps(): GenerationProgressStep[] {
  return AGENT_STEP_TEMPLATE.map((step) => ({ ...step, status: "pending" }));
}

/** Merges one streamed step into the timeline, appending unseen step ids. */
function mergeStep(
  steps: GenerationProgressStep[],
  incoming: GenerationProgressStep,
): GenerationProgressStep[] {
  const index = steps.findIndex((step) => step.id === incoming.id);
  if (index === -1) {
    return [...steps, incoming];
  }
  const next = [...steps];
  next[index] = { ...next[index], ...incoming };
  return next;
}

/** Marks every outstanding phase as completed once a result has arrived. */
function completeSteps(
  steps: GenerationProgressStep[],
): GenerationProgressStep[] {
  return steps.map((step) =>
    step.status === "completed" ? step : { ...step, status: "completed" },
  );
}

function isAbortError(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    (error as { name?: string }).name === "AbortError"
  );
}

export interface AgentState {
  projectId: string;
  status: AgentStatus;
  prompt: string;
  steps: GenerationProgressStep[];
  startedAt: number | null;
  result: GenerateApiResponse | null;
  resolutions: Record<string, ConflictResolution>;
  error: string | null;
  errorPhase: AgentErrorPhase | null;
  applied: ApplyApiResponse | null;
}

export interface AgentActions {
  setPrompt: (prompt: string) => void;
  /** Starts a run with the current prompt. */
  startRun: () => Promise<void>;
  /** Re-runs the last action that failed, based on `errorPhase`. */
  retry: () => Promise<void>;
  /** Aborts an in-flight generation and returns to idle. */
  cancel: () => void;
  /** Clears the generated result and timeline, keeping the prompt. */
  reset: () => void;
  setResolution: (conflictKey: string, resolution: ConflictResolution) => void;
  applyChanges: () => Promise<void>;
}

export type AgentStore = AgentState & AgentActions;

export type AgentStoreApi = StoreApi<AgentStore>;

/** Stable key the server uses to associate a resolution with a conflict. */
export function conflictKey(conflict: {
  method: string;
  path: string;
}): string {
  return `${conflict.method}:${conflict.path}`;
}

export function createAgentStore(projectId: string): AgentStoreApi {
  let controller: AbortController | null = null;

  const idleState: AgentState = {
    projectId,
    status: "idle",
    prompt: "",
    steps: createPendingSteps(),
    startedAt: null,
    result: null,
    resolutions: {},
    error: null,
    errorPhase: null,
    applied: null,
  };

  return createStore<AgentStore>((set, get) => {
    const runGeneration = async (): Promise<void> => {
      const prompt = get().prompt.trim();
      if (!prompt) {
        set({
          error: "Describe the API you want before running the agent.",
          errorPhase: "generate",
        });
        return;
      }

      controller?.abort();
      controller = new AbortController();

      set({
        status: "running",
        steps: createPendingSteps(),
        startedAt: Date.now(),
        result: null,
        resolutions: {},
        error: null,
        errorPhase: null,
        applied: null,
      });

      const handleEvent = (event: AgentStreamEvent) => {
        if (event.type === "progress") {
          set((state) => ({ steps: mergeStep(state.steps, event.step) }));
          return;
        }
        if (event.type === "complete") {
          set((state) => ({
            status: "ready",
            result: event.result,
            steps: completeSteps(state.steps),
          }));
        }
      };

      try {
        await streamApiGeneration({
          projectId: get().projectId,
          prompt,
          signal: controller.signal,
          onEvent: handleEvent,
        });

        // A stream that closes without a result leaves the run unfinished.
        if (get().status === "running") {
          set({
            status: "error",
            error: "The agent stopped before returning a result. Try again.",
            errorPhase: "generate",
          });
        }
      } catch (error) {
        if (isAbortError(error)) return;

        set({
          status: "error",
          error:
            error instanceof AgentGenerationError
              ? error.message
              : "The agent could not reach the model. Try again.",
          errorPhase: "generate",
        });
      } finally {
        controller = null;
      }
    };

    const applyResult = async (): Promise<void> => {
      const { result, projectId: currentProjectId, resolutions } = get();

      if (!result?.proposalId || typeof result.expectedVersion !== "number") {
        set({
          status: "error",
          error: "This generation has no saved proposal to apply.",
          errorPhase: "apply",
        });
        return;
      }

      set({ status: "applying", error: null, errorPhase: null });

      try {
        const response = await fetch("/api/ai/apply", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            projectId: currentProjectId,
            proposalId: result.proposalId,
            expectedVersion: result.expectedVersion,
            resolutions,
          }),
        });

        const body = (await response.json()) as ApplyApiResponse;

        if (!response.ok || !body.success) {
          throw new Error(
            body.error ?? `Could not apply the changes (${response.status})`,
          );
        }

        set({
          ...idleState,
          applied: body,
        });
      } catch (error) {
        set({
          status: "error",
          error:
            error instanceof Error
              ? error.message
              : "Could not apply the changes.",
          errorPhase: "apply",
        });
      }
    };

    return {
      ...idleState,

      setPrompt: (prompt) => set({ prompt }),

      startRun: runGeneration,

      retry: async () => {
        if (get().errorPhase === "apply") {
          await applyResult();
          return;
        }
        await runGeneration();
      },

      cancel: () => {
        controller?.abort();
        controller = null;
        set({
          status: "idle",
          startedAt: null,
          steps: createPendingSteps(),
        });
      },

      reset: () =>
        set({
          ...idleState,
          prompt: get().prompt,
        }),

      setResolution: (key, resolution) =>
        set((state) => ({
          resolutions: { ...state.resolutions, [key]: resolution },
        })),

      applyChanges: applyResult,
    };
  });
}
