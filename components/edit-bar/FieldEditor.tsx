"use client";

import * as React from "react";
import {
  Plus,
  Trash2,
  CornerDownRight,
  ArrowUp,
  ArrowDown,
  GripVertical,
} from "lucide-react";
import { useSchemaStore } from "@/stores/store-provider";
import { FakerProviderSelect } from "./FakerProviderSelect";
import type { SchemaField } from "@/lib/schema-synthesizer";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface FieldEditorProps {
  field: SchemaField;
  depth: number;
}

const FIELD_TYPES = [
  "string",
  "number",
  "integer",
  "boolean",
  "object",
  "array",
] as const;
const ARRAY_ITEM_TYPES = [
  "string",
  "number",
  "integer",
  "boolean",
  "object",
] as const;

function isFieldType(value: unknown): value is SchemaField["type"] {
  return (
    typeof value === "string" &&
    (FIELD_TYPES as readonly string[]).includes(value)
  );
}

function isArrayItemType(
  value: unknown,
): value is Exclude<SchemaField["arrayItemType"], undefined> {
  return (
    typeof value === "string" &&
    (ARRAY_ITEM_TYPES as readonly string[]).includes(value)
  );
}

let activeDraggedFieldId: string | null = null;

/**
 * Recursive field row editor in the JSON Schema Builder tree.
 * Automatically displays conditional selectors based on data types.
 */
export function FieldEditor({
  field,
  depth,
}: FieldEditorProps): React.JSX.Element {
  const updateField = useSchemaStore((state) => state.updateField);
  const removeField = useSchemaStore((state) => state.removeField);
  const addField = useSchemaStore((state) => state.addField);
  const moveField = useSchemaStore((state) => state.moveField);
  const reorderField = useSchemaStore((state) => state.reorderField);
  const [isDragOver, setIsDragOver] = React.useState(false);

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    updateField(field.id, { name: e.target.value });
  };

  const handleTypeChange = (value: SchemaField["type"]) => {
    updateField(field.id, { type: value });
  };

  const handleNullableChange = (checked: boolean) => {
    updateField(field.id, { nullable: checked });
  };

  const handleFakerChange = (value: string) => {
    updateField(field.id, { fakerProvider: value });
  };

  const handleArrayItemTypeChange = (value: SchemaField["arrayItemType"]) => {
    updateField(field.id, { arrayItemType: value });
  };

  const handleArrayItemFakerChange = (value: string) => {
    updateField(field.id, { arrayItemFakerProvider: value });
  };

  const isObject = field.type === "object";
  const isArray = field.type === "array";
  const isPrimitive = !isObject && !isArray;

  const isCustomImage =
    isPrimitive &&
    (field.fakerProvider === "image.customCategory" ||
      (field.fakerProvider?.startsWith("image.customCategory:") ?? false));

  const isCustomArrayItemImage =
    isArray &&
    field.arrayItemType === "string" &&
    (field.arrayItemFakerProvider === "image.customCategory" ||
      (field.arrayItemFakerProvider?.startsWith("image.customCategory:") ??
        false));

  const customCategoryName = React.useMemo(() => {
    if (isCustomImage) {
      if (field.fakerProvider?.startsWith("image.customCategory:")) {
        return field.fakerProvider.slice("image.customCategory:".length);
      }
    }
    return "";
  }, [isCustomImage, field.fakerProvider]);

  const customArrayItemCategoryName = React.useMemo(() => {
    if (isCustomArrayItemImage) {
      if (field.arrayItemFakerProvider?.startsWith("image.customCategory:")) {
        return field.arrayItemFakerProvider.slice(
          "image.customCategory:".length,
        );
      }
    }
    return "";
  }, [isCustomArrayItemImage, field.arrayItemFakerProvider]);

  const handleCustomCategoryChange = (
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const val = e.target.value;
    if (val) {
      updateField(field.id, { fakerProvider: `image.customCategory:${val}` });
    } else {
      updateField(field.id, { fakerProvider: "image.customCategory" });
    }
  };

  const handleCustomArrayItemCategoryChange = (
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const val = e.target.value;
    if (val) {
      updateField(field.id, {
        arrayItemFakerProvider: `image.customCategory:${val}`,
      });
    } else {
      updateField(field.id, { arrayItemFakerProvider: "image.customCategory" });
    }
  };

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
          "border-border bg-card/65 hover:border-muted-foreground/15 relative flex flex-wrap items-center gap-1.5 rounded-md border px-2 py-1.5 transition-all",
          isDragOver && "border-primary/60 bg-primary/5",
          depth > 0 && "ml-3",
        )}
        onDragOver={handleDragOver}
        onDragLeave={() => setIsDragOver(false)}
        onDrop={handleDrop}
      >
        {/* Nesting Indicator */}
        {depth > 0 && (
          <CornerDownRight className="text-muted-foreground/60 absolute top-3 -left-3 h-3 w-3" />
        )}

        {/* Drag Handle */}
        <span
          draggable
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
          className="text-muted-foreground/70 inline-flex h-7 w-5 cursor-grab items-center justify-center active:cursor-grabbing"
          title="Drag to reorder"
        >
          <GripVertical className="h-3.5 w-3.5" />
        </span>

        {/* Field Name */}
        <Input
          value={field.name}
          onChange={handleNameChange}
          placeholder="Field key"
          className="h-7 w-30 shrink-0 font-mono text-xs font-semibold"
        />

        {/* Field Type */}
        <Select
          value={field.type}
          onValueChange={(val) => {
            if (isFieldType(val)) handleTypeChange(val);
          }}
        >
          <SelectTrigger className="h-7 w-20 shrink-0 text-xs font-medium">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="string">String</SelectItem>
            <SelectItem value="number">Number</SelectItem>
            <SelectItem value="integer">Integer</SelectItem>
            <SelectItem value="boolean">Boolean</SelectItem>
            <SelectItem value="object">Object</SelectItem>
            <SelectItem value="array">Array</SelectItem>
          </SelectContent>
        </Select>

        {/* Nullable Switch */}
        <div className="flex shrink-0 items-center gap-1 px-0.5">
          <Switch
            checked={field.nullable}
            onCheckedChange={handleNullableChange}
            className="h-4 scale-[0.65]"
          />
          <span className="text-muted-foreground text-[9px] font-semibold uppercase">
            Null
          </span>
        </div>

        {/* Faker.js Provider Select (Primitives only) */}
        {isPrimitive && (
          <div className="min-w-30 flex-1">
            <FakerProviderSelect
              value={field.fakerProvider || undefined}
              onValueChange={handleFakerChange}
            />
          </div>
        )}

        {/* Array Options */}
        {isArray && (
          <div className="flex min-w-37.5 flex-1 items-center gap-1.5">
            <span className="text-muted-foreground shrink-0 text-[9px] font-bold uppercase">
              Items:
            </span>
            <Select
              value={field.arrayItemType || "string"}
              onValueChange={(val) => {
                if (isArrayItemType(val)) handleArrayItemTypeChange(val);
              }}
            >
              <SelectTrigger className="h-7 w-20 shrink-0 text-xs font-medium">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="string">String</SelectItem>
                <SelectItem value="number">Number</SelectItem>
                <SelectItem value="integer">Integer</SelectItem>
                <SelectItem value="boolean">Boolean</SelectItem>
                <SelectItem value="object">Object</SelectItem>
              </SelectContent>
            </Select>

            {field.arrayItemType !== "object" && (
              <div className="min-w-25 flex-1">
                <FakerProviderSelect
                  value={field.arrayItemFakerProvider || undefined}
                  onValueChange={handleArrayItemFakerChange}
                />
              </div>
            )}
          </div>
        )}

        {/* Action Controls */}
        <div className="ml-auto flex shrink-0 items-center gap-0.5">
          {/* Reorder Buttons */}
          <Button
            type="button"
            size="icon"
            variant="ghost"
            className="text-muted-foreground hover:text-foreground hover:bg-muted h-7 w-7"
            title="Move Up"
            onClick={() => moveField(field.id, "up")}
          >
            <ArrowUp className="h-3.5 w-3.5" />
          </Button>
          <Button
            type="button"
            size="icon"
            variant="ghost"
            className="text-muted-foreground hover:text-foreground hover:bg-muted h-7 w-7"
            title="Move Down"
            onClick={() => moveField(field.id, "down")}
          >
            <ArrowDown className="h-3.5 w-3.5" />
          </Button>

          {/* Add Child Button (Only for Object type, or Array items of type Object) */}
          {(isObject || (isArray && field.arrayItemType === "object")) && (
            <Button
              type="button"
              size="icon"
              variant="outline"
              className="hover:bg-primary/5 h-7 w-7"
              onClick={() => addField(field.id)}
            >
              <Plus className="h-3.5 w-3.5" />
            </Button>
          )}
          <Button
            type="button"
            size="icon"
            variant="ghost"
            className="text-destructive hover:bg-destructive/10 h-7 w-7"
            onClick={() => removeField(field.id)}
          >
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>

      {/* Custom Category Image Parameter Inputs */}
      {isCustomImage && (
        <div className="flex items-center gap-2 pb-1 pl-7 text-xs">
          <span className="text-muted-foreground shrink-0 text-[9px] font-bold uppercase">
            Category Name:
          </span>
          <Input
            value={customCategoryName}
            onChange={handleCustomCategoryChange}
            placeholder="e.g. puppy, nature, architecture"
            className="h-6 w-48 shrink-0 px-2 py-0.5 text-xs font-medium"
          />
        </div>
      )}

      {isCustomArrayItemImage && (
        <div className="flex items-center gap-2 pb-1 pl-7 text-xs">
          <span className="text-muted-foreground shrink-0 text-[9px] font-bold uppercase">
            Array Item Category:
          </span>
          <Input
            value={customArrayItemCategoryName}
            onChange={handleCustomArrayItemCategoryChange}
            placeholder="e.g. puppy, nature, architecture"
            className="h-6 w-48 shrink-0 px-2 py-0.5 text-xs font-medium"
          />
        </div>
      )}

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
}
export default FieldEditor;
