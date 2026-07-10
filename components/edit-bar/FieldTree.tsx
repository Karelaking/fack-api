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
      <div className="flex items-center justify-between border-b border-border pb-2">
        <div className="space-y-0.5">
          <h3 className="text-xs font-semibold flex items-center gap-1.5">
            <FileJson className="h-3.5 w-3.5 text-primary" />
            <span>Response Schema Fields</span>
          </h3>
          <p className="text-[10px] text-muted-foreground leading-normal pr-4">
            Configure keys, types, and mock datatypes. Drag and drop rows to reorder.
          </p>
        </div>
        <Button type="button" size="sm" onClick={() => addField()} className="h-7 gap-1 text-[11px] font-semibold">
          <Plus className="h-3 w-3" />
          <span>Add Root Field</span>
        </Button>
      </div>

      {/* Fields List */}
      {fields.length === 0 ? (
        <div className="flex flex-col items-center justify-center p-6 bg-muted/30 border border-dashed rounded-lg text-center space-y-1.5">
          <HelpCircle className="h-6 w-6 text-muted-foreground/60 stroke-1" />
          <div className="text-xs font-semibold">No fields configured</div>
          <p className="text-[10px] text-muted-foreground max-w-60 leading-normal">
            An empty schema will return a default empty JSON object `{}`.
          </p>
          <Button type="button" size="xs" variant="secondary" onClick={() => addField()} className="h-6.5 text-[10px] px-2 font-bold">
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
