"use client";

import * as React from "react";
import { RiTimeLine, RiAlertLine } from "@remixicon/react";
import { Slider } from "@/components/ui/slider";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

const CHAOS_PRESETS = [
  { label: "Normal", min: 0, max: 0, errorRate: 0 },
  { label: "Fast 4G", min: 50, max: 150, errorRate: 0 },
  { label: "Slow 3G", min: 1000, max: 2000, errorRate: 0 },
  { label: "Flaky", min: 200, max: 500, errorRate: 15 },
  { label: "Severe", min: 2000, max: 4000, errorRate: 50 },
] as const;

interface ChaosConfigProps {
  latencyMin: number;
  latencyMax: number;
  errorRate: number;
  onLatencyMinChange: (latencyMin: number) => void;
  onLatencyMaxChange: (latencyMax: number) => void;
  onErrorRateChange: (errorRate: number) => void;
}

/**
 * Visual configuration component for simulating latency and request error rates.
 */
export function ChaosConfig({
  latencyMin,
  latencyMax,
  errorRate,
  onLatencyMinChange,
  onLatencyMaxChange,
  onErrorRateChange,
}: ChaosConfigProps): React.JSX.Element {
  // Sync local states
  const handleLatencyMinChange = (value: number | readonly number[]) => {
    const nextLatency = Array.isArray(value) ? value[0] : value;
    onLatencyMinChange(nextLatency);
    if (latencyMax < nextLatency) {
      onLatencyMaxChange(nextLatency);
    }
  };

  const handleLatencyMaxChange = (value: number | readonly number[]): void => {
    const nextLatency = Array.isArray(value) ? value[0] : value;
    onLatencyMaxChange(nextLatency);
    if (latencyMin > nextLatency) {
      onLatencyMinChange(nextLatency);
    }
  };

  const handleErrorRateChange = (
    e: React.ChangeEvent<HTMLInputElement>,
  ): void => {
    const parsed = parseFloat(e.target.value);
    if (!isNaN(parsed)) {
      onErrorRateChange(Math.max(0, Math.min(100, parsed)));
    } else if (e.target.value === "") {
      onErrorRateChange(0);
    }
  };

  return (
    <div className="space-y-4">
      {/* Quick Simulation Presets */}
      <div className="space-y-1.5">
        <span className="text-muted-foreground block text-[10px] font-bold tracking-wider uppercase">
          Quick Simulation Presets
        </span>
        <div className="grid grid-cols-5 gap-1.5">
          {CHAOS_PRESETS.map((preset) => {
            const isMatch =
              latencyMin === preset.min &&
              latencyMax === preset.max &&
              errorRate === preset.errorRate;
            return (
              <button
                key={preset.label}
                type="button"
                onClick={() => {
                  onLatencyMinChange(preset.min);
                  onLatencyMaxChange(preset.max);
                  onErrorRateChange(preset.errorRate);
                }}
                className={cn(
                  "flex cursor-pointer flex-col items-center gap-0.5 border p-1.5 text-center transition-all",
                  isMatch
                    ? "bg-primary text-primary-foreground border-primary shadow-xs"
                    : "bg-muted/30 hover:bg-muted border-border text-foreground",
                )}
              >
                <span className="text-[10px] leading-none font-bold">
                  {preset.label}
                </span>
                <span
                  className={cn(
                    "max-w-full truncate font-mono text-[8px] leading-tight",
                    isMatch
                      ? "text-primary-foreground/80"
                      : "text-muted-foreground",
                  )}
                >
                  {preset.errorRate > 0
                    ? `${preset.errorRate}% err`
                    : `${preset.max}ms`}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Latency Section */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <RiTimeLine className="h-3.5 w-3.5 text-amber-500" />
            <h3 className="text-xs font-semibold">Simulated Latency</h3>
          </div>
          <span className="bg-muted border-border border px-1.5 py-0.5 font-mono text-[11px] font-medium">
            {latencyMin === latencyMax
              ? `${latencyMin} ms`
              : `${latencyMin} - ${latencyMax} ms`}
          </span>
        </div>

        <div className="space-y-3">
          {/* Min Latency */}
          <div className="space-y-1 py-1">
            <div className="text-muted-foreground flex items-center justify-between text-[11px] font-medium">
              <span>Minimum Delay</span>
              <span>{latencyMin} ms</span>
            </div>
            <Slider
              aria-label="Minimum Delay"
              value={[latencyMin]}
              onValueChange={handleLatencyMinChange}
              min={0}
              max={10000}
              step={50}
            />
          </div>

          {/* Max Latency */}
          <div className="space-y-1 py-1">
            <div className="text-muted-foreground flex items-center justify-between text-[11px] font-medium">
              <span>Maximum Delay</span>
              <span>{latencyMax} ms</span>
            </div>
            <Slider
              aria-label="Maximum Delay"
              value={[latencyMax]}
              onValueChange={handleLatencyMaxChange}
              min={0}
              max={10000}
              step={50}
            />
          </div>
        </div>
      </div>

      {/* Error Rate Section */}
      <div className="border-border space-y-3 border-t pt-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <RiAlertLine className="text-destructive h-3.5 w-3.5" />
            <h3 className="text-xs font-semibold">Probabilistic Failures</h3>
          </div>
          <span className="bg-muted border-border border px-1.5 py-0.5 font-mono text-[11px] font-medium">
            {errorRate}% chance
          </span>
        </div>

        <div className="grid gap-1.5">
          <label
            htmlFor="err-percentage"
            className="text-muted-foreground text-[11px] font-medium"
          >
            Failure Rate (Percentage)
          </label>
          <div className="flex items-center gap-2.5">
            <Input
              id="err-percentage"
              type="number"
              min={0}
              max={100}
              step={1}
              value={errorRate || ""}
              onChange={handleErrorRateChange}
              className="w-20"
              placeholder="0"
            />
            <span className="text-muted-foreground text-[11px] leading-normal">
              {errorRate > 0
                ? `${errorRate}% of requests fail with a 500 error.`
                : "No simulated failures."}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
export default ChaosConfig;
