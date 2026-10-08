"use client";

import * as React from "react";
import { RiAddLine, RiQuestionLine, RiFileCodeLine } from "@remixicon/react";
import { useSchemaStore } from "@/stores/store-provider";
import { FieldEditor } from "./FieldEditor";
import { FieldSettingsModal } from "./FieldSettingsModal";
import { Button } from "@/components/ui/button";

import { toast } from "sonner";
import type { SchemaField } from "@/lib/schema-synthesizer";

const USER_STARTER: SchemaField[] = [
  {
    id: "starter-user-id",
    name: "id",
    type: "string",
    nullable: false,
    fakerProvider: "string.uuid",
  },
  {
    id: "starter-user-name",
    name: "name",
    type: "string",
    nullable: false,
    fakerProvider: "person.fullName",
  },
  {
    id: "starter-user-email",
    name: "email",
    type: "string",
    nullable: false,
    fakerProvider: "internet.email",
  },
  {
    id: "starter-user-avatar",
    name: "avatar",
    type: "string",
    nullable: true,
    fakerProvider: "image.avatar",
  },
  {
    id: "starter-user-active",
    name: "isActive",
    type: "boolean",
    nullable: false,
    fakerProvider: "datatype.boolean",
  },
];

const PRODUCT_STARTER: SchemaField[] = [
  {
    id: "starter-prod-id",
    name: "id",
    type: "string",
    nullable: false,
    fakerProvider: "string.uuid",
  },
  {
    id: "starter-prod-title",
    name: "title",
    type: "string",
    nullable: false,
    fakerProvider: "commerce.productName",
  },
  {
    id: "starter-prod-price",
    name: "price",
    type: "number",
    nullable: false,
    fakerProvider: "commerce.price",
  },
  {
    id: "starter-prod-category",
    name: "category",
    type: "string",
    nullable: false,
    fakerProvider: "commerce.department",
  },
  {
    id: "starter-prod-stock",
    name: "inStock",
    type: "boolean",
    nullable: false,
    fakerProvider: "datatype.boolean",
  },
];

/**
 * Root container for response payload schema editing.
 * Maps field tree arrays to interactive recursive rows.
 */
export function FieldTree(): React.JSX.Element {
  const fields = useSchemaStore((state) => state.fields);
  const addField = useSchemaStore((state) => state.addField);
  const setSchema = useSchemaStore((state) => state.setSchema);

  const [modalOpen, setModalOpen] = React.useState(false);

  const handleLoadStarter = (starter: SchemaField[], label: string) => {
    // Generate fresh IDs for starter fields
    const fresh = starter.map((f) => ({ ...f, id: crypto.randomUUID() }));
    setSchema(fresh);
    toast.success(`Loaded ${label} template schema`);
  };

  const handleAddRootField = (data: Partial<Omit<SchemaField, "id">>) => {
    addField(undefined, data);
  };

  return (
    <div className="space-y-4 pt-1">
      <div className="border-border flex items-start justify-between gap-4 border-b pb-3">
        <div className="flex-1 space-y-1">
          <h3 className="flex items-center gap-1.5 text-sm font-semibold">
            <RiFileCodeLine className="text-primary h-4 w-4" />
            <span>Response Schema Fields</span>
          </h3>
          <p className="text-muted-foreground max-w-[90%] text-xs leading-relaxed">
            Configure keys, types, and mock datatypes. Drag and drop rows to
            reorder.
          </p>
        </div>
        <Button
          type="button"
          size="sm"
          className="shrink-0"
          title="Add Root Field"
          aria-label="Add Root Field"
          onClick={() => setModalOpen(true)}
        >
          <RiAddLine className="mr-1 h-4 w-4" />
          <span>Add Field</span>
        </Button>
      </div>

      {/* Fields List */}
      {fields.length === 0 ? (
        <div className="bg-muted/20 border-border/80 flex flex-col items-center justify-center space-y-2 border border-dashed p-6 text-center">
          <RiQuestionLine className="text-muted-foreground/60 h-6 w-6 stroke-1" />
          <div className="text-xs font-semibold">
            No schema fields configured
          </div>
          <p className="text-muted-foreground text-mini max-w-64 leading-normal">
            An empty schema returns `{}`. Start by adding a single blank field
            or initialize with a common starter template.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-1.5 pt-1">
            <Button
              type="button"
              size="xs"
              variant="default"
              onClick={() => setModalOpen(true)}
            >
              Add Blank Field
            </Button>
            <Button
              type="button"
              size="xs"
              variant="outline"
              onClick={() => handleLoadStarter(USER_STARTER, "User")}
            >
              User Template
            </Button>
            <Button
              type="button"
              size="xs"
              variant="outline"
              onClick={() => handleLoadStarter(PRODUCT_STARTER, "Product")}
            >
              Product Template
            </Button>
          </div>
        </div>
      ) : (
        <div className="space-y-1.5 pr-1">
          {fields.map((field) => (
            <FieldEditor key={field.id} field={field} depth={0} />
          ))}
        </div>
      )}

      <FieldSettingsModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        onSave={handleAddRootField}
        title="Add Root Field"
      />
    </div>
  );
}
export default FieldTree;
