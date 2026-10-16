"use client";

import * as React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
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
import { FakerProviderSelect } from "./FakerProviderSelect";
import type { SchemaField } from "@/lib/schema-synthesizer";

interface FieldSettingsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialData?: Partial<SchemaField>;
  onSave: (fieldUpdates: Partial<Omit<SchemaField, "id">>) => void;
  title?: string;
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

export function FieldSettingsModal({
  open,
  onOpenChange,
  initialData,
  onSave,
  title = "Field Settings",
}: FieldSettingsModalProps) {
  const [name, setName] = React.useState("");
  const [type, setType] = React.useState<SchemaField["type"]>("string");
  const [nullable, setNullable] = React.useState(false);
  const [fakerProvider, setFakerProvider] = React.useState("");
  const [arrayItemType, setArrayItemType] =
    React.useState<SchemaField["arrayItemType"]>("string");
  const [arrayItemFakerProvider, setArrayItemFakerProvider] =
    React.useState("");
  React.useEffect(() => {
    if (open) {
      // eslint-disable-next-line react/set-state-in-effect
      setName(initialData?.name || "");
      setType(initialData?.type || "string");
      setNullable(initialData?.nullable || false);
      setFakerProvider(initialData?.fakerProvider || "");
      setArrayItemType(initialData?.arrayItemType || "string");
      setArrayItemFakerProvider(initialData?.arrayItemFakerProvider || "");
    }
  }, [open, initialData]);

  const handleSave = () => {
    onSave({
      name,
      type,
      nullable,
      fakerProvider: fakerProvider || undefined,
      arrayItemType: type === "array" ? arrayItemType : undefined,
      arrayItemFakerProvider:
        type === "array" && arrayItemType !== "object"
          ? arrayItemFakerProvider || undefined
          : undefined,
    });
    onOpenChange(false);
  };

  const isPrimitive = type !== "object" && type !== "array";
  const isArray = type === "array";

  const isCustomImage =
    isPrimitive &&
    (fakerProvider === "image.customCategory" ||
      fakerProvider.startsWith("image.customCategory:"));

  const isCustomArrayItemImage =
    isArray &&
    arrayItemType === "string" &&
    (arrayItemFakerProvider === "image.customCategory" ||
      arrayItemFakerProvider.startsWith("image.customCategory:"));

  const customCategoryName = isCustomImage
    ? fakerProvider.slice("image.customCategory:".length)
    : "";

  const customArrayItemCategoryName = isCustomArrayItemImage
    ? arrayItemFakerProvider.slice("image.customCategory:".length)
    : "";

  const handleCustomCategoryChange = (category: string) => {
    if (category) {
      setFakerProvider(`image.customCategory:${category}`);
    } else {
      setFakerProvider("image.customCategory");
    }
  };

  const handleCustomArrayItemCategoryChange = (category: string) => {
    if (category) {
      setArrayItemFakerProvider(`image.customCategory:${category}`);
    } else {
      setArrayItemFakerProvider("image.customCategory");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-106.25">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <label
              htmlFor="field-name"
              className="text-right text-sm font-semibold"
            >
              Name
            </label>
            <Input
              id="field-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="col-span-3"
              placeholder="field_name"
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <label
              htmlFor="field-type"
              className="text-right text-sm font-semibold"
            >
              Type
            </label>
            <div className="col-span-3">
              <Select
                value={type}
                onValueChange={(nextType) => {
                  if (nextType) setType(nextType as SchemaField["type"]);
                }}
              >
                <SelectTrigger id="field-type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {FIELD_TYPES.map((t) => (
                    <SelectItem key={t} value={t}>
                      {t.charAt(0).toUpperCase() + t.slice(1)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-4 items-center gap-4">
            <label
              htmlFor="field-nullable"
              className="text-right text-sm font-semibold"
            >
              Nullable
            </label>
            <div className="col-span-3 flex items-center gap-2">
              <Switch
                id="field-nullable"
                aria-label="Allow null values"
                checked={nullable}
                onCheckedChange={setNullable}
              />
              <span className="text-muted-foreground text-sm">
                Allow null values
              </span>
            </div>
          </div>

          {isPrimitive && (
            <div className="grid grid-cols-4 items-center gap-4">
              <label
                htmlFor="field-mock-data"
                className="text-right text-sm font-semibold"
              >
                Mock Data
              </label>
              <div className="col-span-3 space-y-2">
                <FakerProviderSelect
                  id="field-mock-data"
                  value={fakerProvider || undefined}
                  onValueChange={setFakerProvider}
                />
                {isCustomImage && (
                  <Input
                    id="custom-category-name"
                    aria-label="Custom image category"
                    value={customCategoryName}
                    onChange={(e) => handleCustomCategoryChange(e.target.value)}
                    placeholder="e.g. puppy, nature, architecture"
                    size="sm"
                  />
                )}
              </div>
            </div>
          )}

          {isArray && (
            <>
              <div className="grid grid-cols-4 items-center gap-4">
                <label
                  htmlFor="field-array-item-type"
                  className="text-right text-sm font-semibold"
                >
                  Item Type
                </label>
                <div className="col-span-3">
                  <Select
                    value={arrayItemType || "string"}
                    onValueChange={(nextType) => {
                      if (nextType)
                        setArrayItemType(
                          nextType as SchemaField["arrayItemType"],
                        );
                    }}
                  >
                    <SelectTrigger
                      id="field-array-item-type"
                      aria-label="Array item type"
                    >
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {ARRAY_ITEM_TYPES.map((t) => (
                        <SelectItem key={t} value={t}>
                          {t.charAt(0).toUpperCase() + t.slice(1)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {arrayItemType !== "object" && (
                <div className="grid grid-cols-4 items-center gap-4">
                  <label
                    htmlFor="field-item-mock"
                    className="text-right text-sm font-semibold"
                  >
                    Item Mock
                  </label>
                  <div className="col-span-3 space-y-2">
                    <FakerProviderSelect
                      id="field-item-mock"
                      value={arrayItemFakerProvider || undefined}
                      onValueChange={setArrayItemFakerProvider}
                    />
                    {isCustomArrayItemImage && (
                      <Input
                        id="custom-array-item-category-name"
                        aria-label="Custom array item image category"
                        value={customArrayItemCategoryName}
                        onChange={(e) =>
                          handleCustomArrayItemCategoryChange(e.target.value)
                        }
                        placeholder="e.g. puppy, nature, architecture"
                        size="sm"
                      />
                    )}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
          >
            Cancel
          </Button>
          <Button type="button" onClick={handleSave}>
            Save changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
