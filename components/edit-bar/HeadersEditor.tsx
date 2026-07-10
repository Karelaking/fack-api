"use client";

import * as React from "react";
import { Plus, Trash2 } from "lucide-react";
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

/**
 * Custom Response Headers key-value editor component.
 */
export function HeadersEditor({ headers, onHeadersChange }: HeadersEditorProps) {
  const handleAdd = () => {
    onHeadersChange([...headers, { key: "", value: "" }]);
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
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold">Custom Headers</h3>
        <Button type="button" size="sm" variant="outline" onClick={handleAdd} className="h-8 gap-1 text-xs">
          <Plus className="h-3.5 w-3.5" />
          <span>Add Header</span>
        </Button>
      </div>

      {headers.length === 0 ? (
        <div className="text-center p-6 bg-muted/30 border border-dashed rounded-lg text-xs text-muted-foreground italic">
          No custom headers configured. (Default: Content-Type: application/json)
        </div>
      ) : (
        <div className="space-y-2.5">
          {headers.map((row, index) => (
            <div key={index} className="flex items-center gap-2">
              <Input
                value={row.key}
                onChange={(e) => handleChange(index, "key", e.target.value)}
                placeholder="Header Name (e.g. Authorization)"
                className="h-9 text-xs"
              />
              <Input
                value={row.value}
                onChange={(e) => handleChange(index, "value", e.target.value)}
                placeholder="Value"
                className="h-9 text-xs"
              />
              <Button
                type="button"
                size="icon"
                variant="ghost"
                className="h-9 w-9 text-destructive hover:bg-destructive/10 shrink-0"
                onClick={() => handleRemove(index)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>
      )}
      <p className="text-[10px] text-muted-foreground leading-normal mt-1 italic">
        Headers are injected into the mock response object on matching queries.
      </p>
    </div>
  );
}
export default HeadersEditor;
