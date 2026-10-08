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
  onSave: (data: Partial<Omit<SchemaField, "id">>) => void;
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

  /* eslint-disable react-hooks/set-state-in-effect */
  React.useEffect(() => {
    if (open) {
      setName(initialData?.name || "");
      setType(initialData?.type || "string");
      setNullable(initialData?.nullable || false);
      setFakerProvider(initialData?.fakerProvider || "");
      setArrayItemType(initialData?.arrayItemType || "string");
      setArrayItemFakerProvider(initialData?.arrayItemFakerProvider || "");
    }
  }, [open, initialData]);
  /* eslint-enable react-hooks/set-state-in-effect */

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

  const handleCustomCategoryChange = (val: string) => {
    if (val) {
      setFakerProvider(`image.customCategory:${val}`);
    } else {
      setFakerProvider("image.customCategory");
    }
  };

  const handleCustomArrayItemCategoryChange = (val: string) => {
    if (val) {
      setArrayItemFakerProvider(`image.customCategory:${val}`);
    } else {
      setArrayItemFakerProvider("image.customCategory");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <label className="text-right text-sm font-semibold">Name</label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="col-span-3"
              placeholder="field_name"
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <label className="text-right text-sm font-semibold">Type</label>
            <div className="col-span-3">
              <Select
                value={type}
                onValueChange={(val) => {
                  if (val) setType(val as SchemaField["type"]);
                }}
              >
                <SelectTrigger>
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
            <label className="text-right text-sm font-semibold">Nullable</label>
            <div className="col-span-3 flex items-center gap-2">
              <Switch checked={nullable} onCheckedChange={setNullable} />
              <span className="text-muted-foreground text-sm">
                Allow null values
              </span>
            </div>
          </div>

          {isPrimitive && (
            <div className="grid grid-cols-4 items-center gap-4">
              <label className="text-right text-sm font-semibold">
                Mock Data
              </label>
              <div className="col-span-3 space-y-2">
                <FakerProviderSelect
                  value={fakerProvider || undefined}
                  onValueChange={setFakerProvider}
                />
                {isCustomImage && (
                  <Input
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
                <label className="text-right text-sm font-semibold">
                  Item Type
                </label>
                <div className="col-span-3">
                  <Select
                    value={arrayItemType || "string"}
                    onValueChange={(val) => {
                      if (val)
                        setArrayItemType(val as SchemaField["arrayItemType"]);
                    }}
                  >
                    <SelectTrigger>
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
                  <label className="text-right text-sm font-semibold">
                    Item Mock
                  </label>
                  <div className="col-span-3 space-y-2">
                    <FakerProviderSelect
                      value={arrayItemFakerProvider || undefined}
                      onValueChange={setArrayItemFakerProvider}
                    />
                    {isCustomArrayItemImage && (
                      <Input
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
