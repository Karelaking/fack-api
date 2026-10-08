"use client";

import * as React from "react";
import {
  RiAddLine,
  RiDeleteBin6Line,
  RiCornerDownRightLine,
  RiArrowUpLine,
  RiArrowDownLine,
  RiDragMove2Line,
  RiEditLine,
} from "@remixicon/react";
import { useSchemaStore } from "@/stores/store-provider";
import type { SchemaField } from "@/lib/schema-synthesizer";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { FieldSettingsModal } from "./FieldSettingsModal";

interface FieldEditorProps {
  field: SchemaField;
  depth: number;
}

let activeDraggedFieldId: string | null = null;

export const FieldEditor = ({
  field,
  depth,
}: FieldEditorProps): React.JSX.Element => {
  const updateField = useSchemaStore((state) => state.updateField);
  const removeField = useSchemaStore((state) => state.removeField);
  const addField = useSchemaStore((state) => state.addField);
  const moveField = useSchemaStore((state) => state.moveField);
  const reorderField = useSchemaStore((state) => state.reorderField);

  const [isDragOver, setIsDragOver] = React.useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = React.useState(false);
  const [isAddChildModalOpen, setIsAddChildModalOpen] = React.useState(false);

  const isObject = field.type === "object";
  const isArray = field.type === "array";

  const handleDragStart = (event: React.DragEvent<HTMLElement>) => {
    activeDraggedFieldId = field.id;
    event.dataTransfer.setData("application/x-fack-field-id", field.id);
    event.dataTransfer.effectAllowed = "move";
  };

  const handleDragEnd = () => {
    activeDraggedFieldId = null;
    setIsDragOver(false);
  };

  const handleDragOver = (event: React.DragEvent<HTMLDivElement>) => {
    if (!activeDraggedFieldId || activeDraggedFieldId === field.id) return;
    event.preventDefault();
    if (!isDragOver) setIsDragOver(true);
  };

  const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    const draggedId =
      activeDraggedFieldId ??
      event.dataTransfer.getData("application/x-fack-field-id");
    setIsDragOver(false);
    if (!draggedId || draggedId === field.id) return;
    reorderField(draggedId, field.id);
    activeDraggedFieldId = null;
  };

  return (
    <div className="space-y-1.5">
      {/* Field Row */}
      <div
        className={cn(
          "border-border bg-card/65 hover:border-muted-foreground/15 relative flex flex-wrap items-center gap-2 rounded-md border px-3 py-2 shadow-sm transition-all",
          isDragOver && "border-primary/60 bg-primary/5",
          depth > 0 && "ml-3",
        )}
        onDragOver={handleDragOver}
        onDragLeave={() => setIsDragOver(false)}
        onDrop={handleDrop}
      >
        {/* Nesting Indicator */}
        {depth > 0 && (
          <RiCornerDownRightLine className="text-muted-foreground/60 absolute top-3 -left-3 h-3 w-3" />
        )}

        {/* Drag Handle */}
        <span
          draggable
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
          className="text-muted-foreground/70 inline-flex h-7 w-5 cursor-grab items-center justify-center"
          title="Drag to reorder"
        >
          <RiDragMove2Line className="h-3.5 w-3.5" />
        </span>

        {/* Field Name & Type display */}
        <div className="flex flex-1 items-center gap-2 overflow-hidden">
          <span className="truncate font-mono text-sm font-semibold">
            {field.name}
          </span>
          <span className="text-muted-foreground bg-muted rounded px-1.5 py-0.5 text-xs font-medium">
            {field.type}
            {isArray && field.arrayItemType && ` (${field.arrayItemType})`}
          </span>
          {field.nullable && (
            <span className="text-muted-foreground/70 text-[10px] font-bold tracking-wider uppercase">
              NULL
            </span>
          )}
        </div>

        {/* Action Controls */}
        <div className="ml-auto flex shrink-0 items-center gap-0.5">
          {/* Reorder Buttons */}
          <Button
            type="button"
            size="icon-sm"
            variant="ghost"
            title="Move Up"
            aria-label="Move Up"
            onClick={() => moveField(field.id, "up")}
          >
            <RiArrowUpLine className="h-3.5 w-3.5" />
          </Button>
          <Button
            type="button"
            size="icon-sm"
            variant="ghost"
            title="Move Down"
            aria-label="Move Down"
            onClick={() => moveField(field.id, "down")}
          >
            <RiArrowDownLine className="h-3.5 w-3.5" />
          </Button>

          {/* Edit Button */}
          <Button
            type="button"
            size="icon-sm"
            variant="ghost"
            title="Edit Field"
            aria-label="Edit Field"
            onClick={() => setIsEditModalOpen(true)}
          >
            <RiEditLine className="h-3.5 w-3.5" />
          </Button>

          {/* Add Child Button (Only for Object type, or Array items of type Object) */}
          {(isObject || (isArray && field.arrayItemType === "object")) && (
            <Button
              type="button"
              size="icon-sm"
              variant="outline"
              title="Add Child Field"
              aria-label="Add Child Field"
              onClick={() => setIsAddChildModalOpen(true)}
            >
              <RiAddLine className="h-3.5 w-3.5" />
            </Button>
          )}
          <Button
            type="button"
            size="icon-sm"
            variant="destructive"
            title="Delete Field"
            aria-label="Delete Field"
            onClick={() => removeField(field.id)}
          >
            <RiDeleteBin6Line className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>

      <FieldSettingsModal
        open={isEditModalOpen}
        onOpenChange={setIsEditModalOpen}
        initialData={field}
        onSave={(updates) => updateField(field.id, updates)}
        title="Edit Field"
      />

      <FieldSettingsModal
        open={isAddChildModalOpen}
        onOpenChange={setIsAddChildModalOpen}
        onSave={(data) => addField(field.id, data)}
        title="Add Child Field"
      />

      {/* Recursive Children (Object Children) */}
      {isObject && field.children && field.children.length > 0 && (
        <div className="border-border/80 mt-1 space-y-1.5 border-l pl-2">
          {field.children.map((child) => (
            <FieldEditor key={child.id} field={child} depth={depth + 1} />
          ))}
        </div>
      )}

      {/* Recursive Children (Array Item Object Children) */}
      {isArray &&
        field.arrayItemType === "object" &&
        field.arrayItemChildren &&
        field.arrayItemChildren.length > 0 && (
          <div className="border-border/80 mt-1 space-y-1.5 border-l pl-2">
            {field.arrayItemChildren.map((child) => (
              <FieldEditor key={child.id} field={child} depth={depth + 1} />
            ))}
          </div>
        )}
    </div>
  );
};
export default FieldEditor;
