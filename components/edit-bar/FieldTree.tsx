"use client";

import * as React from "react";
import { Plus, HelpCircle, FileJson } from "lucide-react";
import { useSchemaStore } from "@/stores/store-provider";
import { FieldEditor } from "./FieldEditor";
import { Button } from "@/components/ui/button";

/**
 * Root container for response payload schema editing.
 * Maps field tree arrays to interactive recursive rows.
 */
export function FieldTree(): React.JSX.Element {
  const fields = useSchemaStore((state) => state.fields);
  const addField = useSchemaStore((state) => state.addField);

  return (
    <div className="space-y-3">
      <div className="border-border flex items-center justify-between border-b pb-2">
        <div className="space-y-0.5">
          <h3 className="flex items-center gap-1.5 text-xs font-semibold">
            <FileJson className="text-primary h-3.5 w-3.5" />
            <span>Response Schema Fields</span>
          </h3>
          <p className="text-muted-foreground pr-4 text-[10px] leading-normal">
            Configure keys, types, and mock datatypes. Drag and drop rows to
            reorder.
          </p>
        </div>
        <Button
          type="button"
          size="sm"
          onClick={() => addField()}
          className="h-7 gap-1 text-[11px] font-semibold"
        >
          <Plus className="h-3 w-3" />
          <span>Add Root Field</span>
        </Button>
      </div>

      {/* Fields List */}
      {fields.length === 0 ? (
        <div className="bg-muted/30 flex flex-col items-center justify-center space-y-1.5 rounded-lg border border-dashed p-6 text-center">
          <HelpCircle className="text-muted-foreground/60 h-6 w-6 stroke-1" />
          <div className="text-xs font-semibold">No fields configured</div>
          <p className="text-muted-foreground max-w-60 text-[10px] leading-normal">
            An empty schema will return a default empty JSON object `{}`.
          </p>
          <Button
            type="button"
            size="xs"
            variant="secondary"
            onClick={() => addField()}
            className="h-6.5 px-2 text-[10px] font-bold"
          >
            Add First Field
          </Button>
        </div>
      ) : (
        <div className="space-y-1.5 pr-1">
          {fields.map((field) => (
            <FieldEditor key={field.id} field={field} depth={0} />
          ))}
        </div>
      )}
    </div>
  );
}
export default FieldTree;
