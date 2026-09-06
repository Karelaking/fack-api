"use client";

import * as React from "react";
import { RiAddLine, RiDeleteBin6Line } from "@remixicon/react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export interface HeaderRow {
  key: string;
  value: string;
}

interface HeadersEditorProps {
  headers: HeaderRow[];
  onHeadersChange: (headers: HeaderRow[]) => void;
}

const COMMON_HEADER_PRESETS = [
  { key: "Content-Type", value: "application/json" },
  { key: "Cache-Control", value: "no-cache, no-store, must-revalidate" },
  { key: "Access-Control-Allow-Origin", value: "*" },
  { key: "Authorization", value: "Bearer <token>" },
  { key: "X-RateLimit-Limit", value: "100" },
] as const;

/**
 * Custom Response Headers key-value editor component.
 */
export const HeadersEditor = ({
  headers,
  onHeadersChange,
}: HeadersEditorProps): React.JSX.Element => {
  const handleAdd = () => {
    onHeadersChange([...headers, { key: "", value: "" }]);
  };

  const handleAddPreset = (key: string, value: string) => {
    // Check if key already exists
    if (headers.some((h) => h.key.toLowerCase() === key.toLowerCase())) {
      toast.info(`Header "${key}" is already present.`);
      return;
    }
    onHeadersChange([...headers, { key, value }]);
    toast.success(`Added ${key} header`);
  };

  const handleRemove = (index: number) => {
    onHeadersChange(headers.filter((_, idx) => idx !== index));
  };

  const handleChange = (index: number, field: keyof HeaderRow, val: string) => {
    const updated = headers.map((row, idx) => {
      if (idx === index) {
        return { ...row, [field]: val };
      }
      return row;
    });
    onHeadersChange(updated);
  };

  return (
    <div className="space-y-3">
      {/* Header & Add Button */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-xs font-semibold">Custom Response Headers</h3>
          <p className="text-muted-foreground text-[10px]">
            Injected into mock responses on matching requests.
          </p>
        </div>
        <Button
          type="button"
          size="sm"
          variant="outline"
          onClick={handleAdd}
          className="h-7 gap-1 text-[11px] font-semibold"
        >
          <RiAddLine className="h-3 w-3" />
          <span>Add Header</span>
        </Button>
      </div>

      {/* Quick Header Presets */}
      <div className="space-y-1">
        <span className="text-muted-foreground block text-[9.5px] font-bold tracking-wider uppercase">
          Quick Presets
        </span>
        <div className="flex flex-wrap gap-1">
          {COMMON_HEADER_PRESETS.map((preset) => (
            <button
              key={preset.key}
              type="button"
              onClick={() => handleAddPreset(preset.key, preset.value)}
              className="bg-muted/40 hover:bg-muted border-border text-foreground hover:border-muted-foreground/30 flex cursor-pointer items-center gap-1 border px-2 py-0.5 font-mono text-[9.5px] transition-colors"
            >
              <RiAddLine className="text-muted-foreground h-2.5 w-2.5" />
              <span>{preset.key}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Header Rows */}
      {headers.length === 0 ? (
        <div className="bg-muted/20 border-border/80 flex flex-col items-center justify-center space-y-1.5 border border-dashed p-6 text-center">
          <span className="text-xs font-semibold">No custom headers</span>
          <p className="text-muted-foreground max-w-64 text-[10px] leading-normal">
            Default `Content-Type: application/json` is automatically included.
            Click a preset above or add a custom header.
          </p>
          <Button
            type="button"
            size="xs"
            variant="secondary"
            onClick={handleAdd}
            className="h-6.5 px-2 text-[10px] font-bold"
          >
            Add Custom Header
          </Button>
        </div>
      ) : (
        <div className="space-y-1.5">
          {/* Table column titles */}
          <div className="text-muted-foreground flex items-center gap-1.5 px-0.5 text-[9px] font-bold tracking-wider uppercase">
            <span className="flex-1">Header Key</span>
            <span className="flex-1">Value</span>
            <span className="w-8" />
          </div>

          {headers.map((row, index) => (
            <div key={index} className="flex items-center gap-1.5">
              <Input
                value={row.key}
                onChange={(e) => handleChange(index, "key", e.target.value)}
                placeholder="Header Name"
                aria-label="Header Name"
                className="h-8 font-mono text-xs font-semibold"
              />
              <Input
                value={row.value}
                onChange={(e) => handleChange(index, "value", e.target.value)}
                placeholder="Value"
                aria-label="Header Value"
                className="h-8 font-mono text-xs"
              />
              <Button
                type="button"
                size="icon"
                variant="ghost"
                className="text-destructive hover:bg-destructive/10 h-8 w-8 shrink-0 transition-colors"
                title="Delete Header"
                aria-label="Delete Header"
                onClick={() => handleRemove(index)}
              >
                <RiDeleteBin6Line className="h-3.5 w-3.5" />
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
export default HeadersEditor;
