"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  RiSparkling2Fill,
  RiCloseLine,
  RiLoader2Line,
  RiCheckLine,
  RiArrowGoBackLine,
} from "@remixicon/react";
import { Button } from "@/components/ui/button";
import { AiPromptForm } from "./AiPromptForm";
import { GenerationProgress } from "./GenerationProgress";
import { ApiChangeSetPreview } from "./ApiChangeSetPreview";
import { ConflictResolutionDialog } from "./ConflictResolutionDialog";
import type {
  GeneratedApi,
  ApiChangeSet,
  GenerationProgressStep,
  RouteConflict,
  ApplyApiResponse,
} from "@/lib/types/ai.type";

interface AiArchitectDialogProps {
  projectId?: string;
  projectSlug?: string;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

const DEFAULT_PROGRESS_STEPS: GenerationProgressStep[] = [
  {
    id: "understanding",
    label: "Analyzing requirements & domain scope",
    status: "pending",
  },
  {
    id: "inspecting",
    label: "Inspecting existing project architecture",
    status: "pending",
  },
  {
    id: "expanding_prompt",
    label: "Synthesizing detailed architecture specification",
    status: "pending",
  },
  {
    id: "designing",
    label: "Designing REST endpoints & schema models",
    status: "pending",
  },
  {
    id: "validating",
    label: "Validating REST semantics & mock data bindings",
    status: "pending",
  },
  {
    id: "checking_conflicts",
    label: "Analyzing route collisions & conflict resolution",
    status: "pending",
  },
];

export const AiArchitectDialog = ({
  projectId,
  open: controlledOpen,
  onOpenChange: controlledOnOpenChange,
}: AiArchitectDialogProps): React.JSX.Element | null => {
  const router = useRouter();
  const [internalOpen, setInternalOpen] = React.useState(false);
  const isOpen = controlledOpen !== undefined ? controlledOpen : internalOpen;

  const setOpen = React.useCallback(
    (open: boolean) => {
      if (controlledOnOpenChange) {
        controlledOnOpenChange(open);
      } else {
        setInternalOpen(open);
      }
    },
    [controlledOnOpenChange],
  );

  // Listen for global open event
  React.useEffect(() => {
    const handleOpen = () => setOpen(true);
    window.addEventListener("open-ai-architect-dialog", handleOpen);
    return () =>
      window.removeEventListener("open-ai-architect-dialog", handleOpen);
  }, [setOpen]);

  // Form and Generation State
  const [prompt, setPrompt] = React.useState("");
  const [isGenerating, setIsGenerating] = React.useState(false);
  const [isApplying, setIsApplying] = React.useState(false);
  const [progressSteps, setProgressSteps] = React.useState<
    GenerationProgressStep[]
  >(DEFAULT_PROGRESS_STEPS);

  // Generation Results
  const [generatedApi, setGeneratedApi] = React.useState<
    GeneratedApi | undefined
  >();
  const [changeSet, setChangeSet] = React.useState<ApiChangeSet | undefined>();
  const [conflicts, setConflicts] = React.useState<RouteConflict[]>([]);
  const [detailedPrompt, setDetailedPrompt] = React.useState<
    string | undefined
  >();
  const [detailedSummary, setDetailedSummary] = React.useState<
    string | undefined
  >();
  const [proposalId, setProposalId] = React.useState<string | undefined>();
  const [expectedVersion, setExpectedVersion] = React.useState<
    number | undefined
  >();
  const [resolutions, setResolutions] = React.useState<
    Record<string, "replace" | "skip" | "modify">
  >({});

  const handleResolutionChange = (
    conflictKey: string,
    resolution: "replace" | "skip" | "modify",
  ) => {
    setResolutions((prev) => ({ ...prev, [conflictKey]: resolution }));
  };

  const handleReset = () => {
    setGeneratedApi(undefined);
    setChangeSet(undefined);
    setConflicts([]);
    setDetailedPrompt(undefined);
    setDetailedSummary(undefined);
    setProposalId(undefined);
    setExpectedVersion(undefined);
    setResolutions({});
    setProgressSteps(DEFAULT_PROGRESS_STEPS);
  };

  const handleClose = () => {
    if (!isGenerating && !isApplying) {
      setOpen(false);
      handleReset();
    }
  };

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim()) {
      toast.error("Please describe your API requirement");
      return;
    }

    setIsGenerating(true);
    setProgressSteps(
      DEFAULT_PROGRESS_STEPS.map((s, idx) => ({
        ...s,
        status: idx === 0 ? "active" : "pending",
      })),
    );

    try {
      const response = await fetch("/api/ai/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectId,
          prompt: prompt.trim(),
          stream: true,
        }),
      });

      if (!response.ok) {
        let errorMessage = `Generation request failed (${response.status})`;
        try {
          const errorData = await response.json();
          if (typeof errorData?.error === "string") {
            errorMessage = errorData.error;
          } else if (typeof errorData?.message === "string") {
            errorMessage = errorData.message;
          }
        } catch {
          // Ignore JSON parse failure
        }
        throw new Error(errorMessage);
      }

      if (!response.body) {
        throw new Error("No response body received from generation stream");
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n\n");
        buffer = lines.pop() || "";

        for (const chunk of lines) {
          const eventMatch = chunk.match(/^event:\s*(\w+)/m);
          const dataMatch = chunk.match(/^data:\s*(.+)$/m);

          if (!eventMatch || !dataMatch) continue;

          const event = eventMatch[1];
          const data = JSON.parse(dataMatch[1]);

          if (event === "progress") {
            const step = data as GenerationProgressStep;
            setProgressSteps((prev) =>
              prev.map((p) => {
                if (p.id === step.id) {
                  return step;
                }
                if (p.status === "active" && p.id !== step.id) {
                  return { ...p, status: "completed" };
                }
                return p;
              }),
            );
          } else if (event === "complete") {
            setGeneratedApi(data.generation);
            setChangeSet(data.changeSet);
            setConflicts(data.conflicts || []);
            setDetailedPrompt(data.detailedPrompt);
            setDetailedSummary(data.detailedSummary);
            setProposalId(data.proposalId);
            setExpectedVersion(data.expectedVersion);
            toast.success("API architecture generated successfully!");
          } else if (event === "error") {
            throw new Error(data.message || "Generation error");
          }
        }
      }
    } catch (err) {
      console.error("[Fack AI] Generation failed:", err);
      const message =
        err instanceof Error ? err.message : "Failed to generate API";
      toast.error(message);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleApplyChanges = async () => {
    if (!projectId) {
      toast.error("Project ID is required to apply changes");
      return;
    }

    if (!proposalId || expectedVersion === undefined) {
      toast.error("No valid proposal to apply");
      return;
    }

    setIsApplying(true);
    try {
      const response = await fetch("/api/ai/apply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectId,
          proposalId,
          expectedVersion,
          resolutions,
        }),
      });

      const data = (await response.json()) as ApplyApiResponse;
      if (!data.success) {
        const errorMessage =
          typeof data.error === "string"
            ? data.error
            : "Failed to apply API changes";
        throw new Error(errorMessage);
      }

      toast.success(
        `Applied successfully! Created ${data.created.endpoints} endpoints and ${data.created.routes} routes.`,
      );

      handleClose();
      router.refresh();
    } catch (err) {
      console.error("[Fack AI] Apply failed:", err);
      const message =
        err instanceof Error ? err.message : "Failed to apply changes";
      toast.error(message);
    } finally {
      setIsApplying(false);
    }
  };

  if (!isOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity"
        onClick={handleClose}
      />

      {/* Modal Dialog Content */}
      <div className="bg-card border-border relative flex max-h-[90vh] w-full max-w-3xl flex-col rounded-2xl border shadow-2xl transition-all">
        {/* Modal Header */}
        <div className="border-border/80 flex items-center justify-between border-b px-6 py-4">
          <div className="flex items-center gap-2.5">
            <div className="bg-primary/10 text-primary flex size-9 items-center justify-center rounded-xl">
              <RiSparkling2Fill className="size-5" />
            </div>
            <div>
              <h3 className="text-foreground text-base font-bold">
                Fack AI API Architect
              </h3>
              <p className="text-muted-foreground text-xs">
                Transform natural language backend requirements into runnable
                mock APIs
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleClose}
            disabled={isGenerating || isApplying}
            className="border-border hover:bg-muted text-muted-foreground hover:text-foreground flex size-8 cursor-pointer items-center justify-center rounded-lg border transition-colors"
          >
            <RiCloseLine className="size-4" />
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <div className="flex-1 overflow-y-auto p-6">
          {!generatedApi ? (
            <div className="flex flex-col gap-6">
              <AiPromptForm
                prompt={prompt}
                onPromptChange={setPrompt}
                onSubmit={handleGenerate}
                isGenerating={isGenerating}
              />

              {isGenerating && <GenerationProgress steps={progressSteps} />}
            </div>
          ) : (
            <div className="flex flex-col gap-5">
              {/* Route Collisions Banner */}
              {conflicts.length > 0 && (
                <ConflictResolutionDialog
                  conflicts={conflicts}
                  resolutions={resolutions}
                  onResolutionChange={handleResolutionChange}
                />
              )}

              {/* Generated Specification Preview */}
              <ApiChangeSetPreview
                api={generatedApi}
                detailedPrompt={detailedPrompt}
                detailedSummary={detailedSummary}
              />
            </div>
          )}
        </div>

        {/* Modal Footer Controls */}
        <div className="border-border/80 bg-muted/20 flex items-center justify-between border-t px-6 py-4">
          {generatedApi ? (
            <>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleReset}
                disabled={isApplying}
              >
                <span className="flex items-center gap-1.5">
                  <RiArrowGoBackLine className="size-4" />
                  <span>Refine Prompt</span>
                </span>
              </Button>

              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={handleClose}
                  disabled={isApplying}
                >
                  Cancel
                </Button>
                <Button
                  type="button"
                  size="sm"
                  onClick={handleApplyChanges}
                  disabled={isApplying}
                >
                  <span className="flex items-center gap-1.5">
                    {isApplying ? (
                      <>
                        <RiLoader2Line className="size-4 animate-spin" />
                        <span>Applying Changes...</span>
                      </>
                    ) : (
                      <>
                        <RiCheckLine className="size-4" />
                        <span>Apply to Project</span>
                      </>
                    )}
                  </span>
                </Button>
              </div>
            </>
          ) : (
            <div className="flex w-full justify-between">
              <span className="text-muted-foreground text-xs">
                Output is previewed and verified before modifying project state.
              </span>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={handleClose}
                disabled={isGenerating}
              >
                Cancel
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
