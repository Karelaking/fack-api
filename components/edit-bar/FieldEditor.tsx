"use client";

import * as React from "react";
import { Plus, Trash2, ChevronRight, CornerDownRight, ToggleLeft, ArrowUp, ArrowDown } from "lucide-react";
import { useSchemaStore } from "@/stores/store-provider";
import { FakerProviderSelect } from "./FakerProviderSelect";
import type { SchemaField } from "@/lib/schema-synthesizer";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface FieldEditorProps {
  field: SchemaField;
  depth: number;
}

/**
 * Recursive field row editor in the JSON Schema Builder tree.
 * Automatically displays conditional selectors based on data types.
 */
export function FieldEditor({ field, depth }: FieldEditorProps) {
  const updateField = useSchemaStore((state) => state.updateField);
  const removeField = useSchemaStore((state) => state.removeField);
  const addField = useSchemaStore((state) => state.addField);
  const moveField = useSchemaStore((state) => state.moveField);

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

  return (
    <div className="space-y-2">
      {/* Field Row */}
      <div
        className={cn(
          "flex flex-wrap items-center gap-2 py-2 px-2.5 rounded-lg border border-border bg-card/65 relative transition-all hover:border-muted-foreground/15",
          depth > 0 && "ml-4"
        )}
      >
        {/* Nesting Indicator */}
        {depth > 0 && (
          <CornerDownRight className="absolute left-[-16px] top-4 h-3.5 w-3.5 text-muted-foreground/60" />
        )}

        {/* Field Name */}
        <Input
          value={field.name}
          onChange={handleNameChange}
          placeholder="Field key"
          className="h-8 text-xs font-semibold w-[140px] shrink-0 font-mono"
        />

        {/* Field Type */}
        <Select value={field.type} onValueChange={(val) => val && handleTypeChange(val as any)}>
          <SelectTrigger className="h-8 text-xs w-[90px] shrink-0 font-medium">
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
        <div className="flex items-center gap-1.5 shrink-0 px-1">
          <Switch
            checked={field.nullable}
            onCheckedChange={handleNullableChange}
            className="scale-[0.7] h-5"
          />
          <span className="text-[10px] text-muted-foreground font-semibold uppercase">Null</span>
        </div>

        {/* Faker.js Provider Select (Primitives only) */}
        {isPrimitive && (
          <div className="flex-1 min-w-[150px]">
            <FakerProviderSelect value={field.fakerProvider} onValueChange={handleFakerChange} />
          </div>
        )}

        {/* Array Options */}
        {isArray && (
          <div className="flex items-center gap-2 flex-1 min-w-[200px]">
            <span className="text-[10px] text-muted-foreground font-bold uppercase shrink-0">Items:</span>
            <Select value={field.arrayItemType || "string"} onValueChange={(val) => val && handleArrayItemTypeChange(val as any)}>
              <SelectTrigger className="h-8 text-xs w-[90px] shrink-0 font-medium">
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
              <div className="flex-1">
                <FakerProviderSelect
                  value={field.arrayItemFakerProvider}
                  onValueChange={handleArrayItemFakerChange}
                />
              </div>
            )}
          </div>
        )}

        {/* Action Controls */}
        <div className="flex items-center gap-1 shrink-0 ml-auto">
          {/* Reorder Buttons */}
          <Button
            type="button"
            size="icon"
            variant="ghost"
            className="h-8 w-8 text-muted-foreground hover:text-foreground hover:bg-muted"
            title="Move Up"
            onClick={() => moveField(field.id, "up")}
          >
            <ArrowUp className="h-4 w-4" />
          </Button>
          <Button
            type="button"
            size="icon"
            variant="ghost"
            className="h-8 w-8 text-muted-foreground hover:text-foreground hover:bg-muted"
            title="Move Down"
            onClick={() => moveField(field.id, "down")}
          >
            <ArrowDown className="h-4 w-4" />
          </Button>

          {/* Add Child Button (Only for Object type, or Array items of type Object) */}
          {(isObject || (isArray && field.arrayItemType === "object")) && (
            <Button
              type="button"
              size="icon"
              variant="outline"
              className="h-8 w-8 hover:bg-primary/5"
              onClick={() => addField(field.id)}
            >
              <Plus className="h-4 w-4" />
            </Button>
          )}
          <Button
            type="button"
            size="icon"
            variant="ghost"
            className="h-8 w-8 text-destructive hover:bg-destructive/10"
            onClick={() => removeField(field.id)}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Recursive Children (Object Children) */}
      {isObject && field.children && field.children.length > 0 && (
        <div className="border-l border-border/80 pl-2 mt-1">
          {field.children.map((child) => (
            <FieldEditor key={child.id} field={child} depth={depth + 1} />
          ))}
        </div>
      )}

      {/* Recursive Children (Array Item Object Children) */}
      {isArray && field.arrayItemType === "object" && field.arrayItemChildren && field.arrayItemChildren.length > 0 && (
        <div className="border-l border-border/80 pl-2 mt-1">
          {field.arrayItemChildren.map((child) => (
            <FieldEditor key={child.id} field={child} depth={depth + 1} />
          ))}
        </div>
      )}
    </div>
  );
}
export default FieldEditor;
