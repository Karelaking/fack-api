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
export function HeadersEditor({
  headers,
  onHeadersChange,
}: HeadersEditorProps): React.JSX.Element {
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
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-semibold">Custom Headers</h3>
        <Button
          type="button"
          size="sm"
          variant="outline"
          onClick={handleAdd}
          className="h-7 gap-1 text-xs"
        >
          <Plus className="h-3 w-3" />
          <span>Add Header</span>
        </Button>
      </div>

      {headers.length === 0 ? (
        <div className="bg-muted/30 text-muted-foreground rounded-lg border border-dashed p-5 text-center text-xs italic">
          No custom headers configured. (Default: Content-Type:
          application/json)
        </div>
      ) : (
        <div className="space-y-1.5">
          {headers.map((row, index) => (
            <div key={index} className="flex items-center gap-1.5">
              <Input
                value={row.key}
                onChange={(e) => handleChange(index, "key", e.target.value)}
                placeholder="Header Name (e.g. Authorization)"
                className="h-8 text-xs"
              />
              <Input
                value={row.value}
                onChange={(e) => handleChange(index, "value", e.target.value)}
                placeholder="Value"
                className="h-8 text-xs"
              />
              <Button
                type="button"
                size="icon"
                variant="ghost"
                className="text-destructive hover:bg-destructive/10 h-8 w-8 shrink-0"
                onClick={() => handleRemove(index)}
              >
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </div>
          ))}
        </div>
      )}
      <p className="text-muted-foreground text-[10px] leading-normal italic">
        Headers are injected into the mock response object on matching queries.
      </p>
    </div>
  );
}
export default HeadersEditor;
