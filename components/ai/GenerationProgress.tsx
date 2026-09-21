"use client";

import * as React from "react";
import {
  RiCheckboxCircleFill,
  RiLoader2Line,
  RiTimeLine,
  RiCloseCircleFill,
} from "@remixicon/react";
import type { GenerationProgressStep } from "@/lib/types/ai.type";

interface GenerationProgressProps {
  steps: GenerationProgressStep[];
}

export const GenerationProgress = ({
  steps,
}: GenerationProgressProps): React.JSX.Element => {
  return (
    <div className="border-border/60 bg-muted/30 flex flex-col gap-2.5 rounded-xl border p-4">
      <h4 className="text-foreground text-xs font-semibold tracking-wider uppercase">
        Agent Workflow Progress
      </h4>
      <div className="flex flex-col gap-2">
        {steps.map((step) => {
          const isCompleted = step.status === "completed";
          const isActive = step.status === "active";
          const isFailed = step.status === "failed";

          return (
            <div
              key={step.id}
              className="flex items-center gap-2.5 text-xs transition-colors"
            >
              {isCompleted && (
                <RiCheckboxCircleFill className="size-4 shrink-0 text-emerald-500" />
              )}
              {isActive && (
                <RiLoader2Line className="text-primary size-4 shrink-0 animate-spin" />
              )}
              {isFailed && (
                <RiCloseCircleFill className="text-destructive size-4 shrink-0" />
              )}
              {!isCompleted && !isActive && !isFailed && (
                <RiTimeLine className="text-muted-foreground/60 size-4 shrink-0" />
              )}

              <span
                className={
                  isCompleted
                    ? "text-foreground font-medium"
                    : isActive
                      ? "text-primary font-semibold"
                      : isFailed
                        ? "text-destructive font-medium"
                        : "text-muted-foreground"
                }
              >
                {step.label}
              </span>
              {step.detail && (
                <span className="text-muted-foreground/80 text-[11px]">
                  — {step.detail}
                </span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
