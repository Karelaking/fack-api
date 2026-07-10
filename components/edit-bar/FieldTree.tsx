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
export function FieldTree() {
  const fields = useSchemaStore((state) => state.fields);
  const addField = useSchemaStore((state) => state.addField);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between border-b border-border pb-3">
        <div className="space-y-0.5">
          <h3 className="text-sm font-semibold flex items-center gap-1.5">
            <FileJson className="h-4 w-4 text-primary" />
            <span>Response Schema Fields</span>
          </h3>
          <p className="text-[10px] text-muted-foreground leading-normal">
            Configure keys, types, and mock synthetic datatypes for your JSON payload.
          </p>
        </div>
        <Button type="button" size="sm" onClick={() => addField()} className="h-8 gap-1.5 text-xs font-semibold">
          <Plus className="h-3.5 w-3.5" />
          <span>Add Root Field</span>
        </Button>
      </div>

      {/* Fields List */}
      {fields.length === 0 ? (
        <div className="flex flex-col items-center justify-center p-8 bg-muted/30 border border-dashed rounded-lg text-center space-y-2">
          <HelpCircle className="h-8 w-8 text-muted-foreground/60 stroke-1" />
          <div className="text-xs font-semibold">No fields configured</div>
          <p className="text-[10px] text-muted-foreground max-w-[240px] leading-normal">
            An empty schema will return a default empty JSON object `{}`.
          </p>
          <Button type="button" size="xs" variant="secondary" onClick={() => addField()} className="h-7 text-[10px] px-2.5 font-bold">
            Add First Field
          </Button>
        </div>
      ) : (
        <div className="space-y-3.5 max-h-[500px] overflow-auto pr-1">
          {fields.map((field) => (
            <FieldEditor key={field.id} field={field} depth={0} />
          ))}
        </div>
      )}
    </div>
  );
}
export default FieldTree;
