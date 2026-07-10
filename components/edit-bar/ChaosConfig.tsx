"use client";

import * as React from "react";
import { Clock, AlertTriangle } from "lucide-react";
import { Slider } from "@/components/ui/slider";
import { Input } from "@/components/ui/input";

interface ChaosConfigProps {
  latencyMin: number;
  latencyMax: number;
  errorRate: number;
  onLatencyMinChange: (val: number) => void;
  onLatencyMaxChange: (val: number) => void;
  onErrorRateChange: (val: number) => void;
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
}: ChaosConfigProps) {
  // Sync local states
  const handleMinSlider = (value: number | readonly number[]) => {
    const val = Array.isArray(value) ? value[0] : value;
    onLatencyMinChange(val);
    if (latencyMax < val) {
      onLatencyMaxChange(val);
    }
  };

  const handleMaxSlider = (value: number | readonly number[]) => {
    const val = Array.isArray(value) ? value[0] : value;
    onLatencyMaxChange(val);
    if (latencyMin > val) {
      onLatencyMinChange(val);
    }
  };

  const handleErrorRate = (e: React.ChangeEvent<HTMLInputElement>) => {
    const parsed = parseFloat(e.target.value);
    if (!isNaN(parsed)) {
      onErrorRateChange(Math.max(0, Math.min(100, parsed)));
    } else if (e.target.value === "") {
      onErrorRateChange(0);
    }
  };

  return (
    <div className="space-y-6">
      {/* Latency Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-amber-500" />
            <h3 className="text-sm font-semibold">Simulated Latency</h3>
          </div>
          <span className="text-xs font-mono font-medium bg-muted px-2 py-0.5 rounded border border-border">
            {latencyMin === latencyMax ? `${latencyMin} ms` : `${latencyMin} - ${latencyMax} ms`}
          </span>
        </div>

        <div className="space-y-5">
          {/* Min Latency */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs text-muted-foreground font-medium">
              <span>Minimum Delay</span>
              <span>{latencyMin} ms</span>
            </div>
            <Slider
              value={[latencyMin]}
              onValueChange={handleMinSlider}
              min={0}
              max={10000}
              step={50}
              className="py-1.5"
            />
          </div>

          {/* Max Latency */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs text-muted-foreground font-medium">
              <span>Maximum Delay</span>
              <span>{latencyMax} ms</span>
            </div>
            <Slider
              value={[latencyMax]}
              onValueChange={handleMaxSlider}
              min={0}
              max={10000}
              step={50}
              className="py-1.5"
            />
          </div>
        </div>
        <p className="text-[10px] text-muted-foreground leading-normal mt-1 italic">
          Delays execution thread using async setTimeout promises before responding.
        </p>
      </div>

      {/* Error Rate Section */}
      <div className="space-y-4 pt-4 border-t border-border">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-destructive" />
            <h3 className="text-sm font-semibold">Probabilistic Failures</h3>
          </div>
          <span className="text-xs font-mono font-medium bg-muted px-2 py-0.5 rounded border border-border">
            {errorRate}% chance
          </span>
        </div>

        <div className="grid gap-2">
          <label htmlFor="err-percentage" className="text-xs text-muted-foreground font-medium">
            Failure Rate (Percentage)
          </label>
          <div className="flex items-center gap-3">
            <Input
              id="err-percentage"
              type="number"
              min={0}
              max={100}
              step={1}
              value={errorRate || ""}
              onChange={handleErrorRate}
              className="w-24 h-9"
              placeholder="0"
            />
            <span className="text-xs text-muted-foreground">
              {errorRate > 0
                ? `Approximately ${errorRate} out of 100 requests will fail with 500 error.`
                : "No simulated request failures."}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
export default ChaosConfig;
