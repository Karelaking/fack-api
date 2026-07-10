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
    <div className="space-y-4">
      {/* Latency Section */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <Clock className="h-3.5 w-3.5 text-amber-500" />
            <h3 className="text-xs font-semibold">Simulated Latency</h3>
          </div>
          <span className="text-[11px] font-mono font-medium bg-muted px-1.5 py-0.5 rounded border border-border">
            {latencyMin === latencyMax ? `${latencyMin} ms` : `${latencyMin} - ${latencyMax} ms`}
          </span>
        </div>

        <div className="space-y-3">
          {/* Min Latency */}
          <div className="space-y-1">
            <div className="flex items-center justify-between text-[11px] text-muted-foreground font-medium">
              <span>Minimum Delay</span>
              <span>{latencyMin} ms</span>
            </div>
            <Slider
              value={[latencyMin]}
              onValueChange={handleMinSlider}
              min={0}
              max={10000}
              step={50}
              className="py-1"
            />
          </div>

          {/* Max Latency */}
          <div className="space-y-1">
            <div className="flex items-center justify-between text-[11px] text-muted-foreground font-medium">
              <span>Maximum Delay</span>
              <span>{latencyMax} ms</span>
            </div>
            <Slider
              value={[latencyMax]}
              onValueChange={handleMaxSlider}
              min={0}
              max={10000}
              step={50}
              className="py-1"
            />
          </div>
        </div>
      </div>

      {/* Error Rate Section */}
      <div className="space-y-3 pt-3 border-t border-border">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <AlertTriangle className="h-3.5 w-3.5 text-destructive" />
            <h3 className="text-xs font-semibold">Probabilistic Failures</h3>
          </div>
          <span className="text-[11px] font-mono font-medium bg-muted px-1.5 py-0.5 rounded border border-border">
            {errorRate}% chance
          </span>
        </div>

        <div className="grid gap-1.5">
          <label htmlFor="err-percentage" className="text-[11px] text-muted-foreground font-medium">
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
              onChange={handleErrorRate}
              className="w-20 h-8 text-xs font-medium"
              placeholder="0"
            />
            <span className="text-[11px] text-muted-foreground leading-normal">
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
