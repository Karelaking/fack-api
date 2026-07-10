import { createStore } from "zustand";
import { immer } from "zustand/middleware/immer";
import type { SchemaField } from "@/lib/schema-synthesizer";
import { generateId } from "@/lib/utils";

// ─── Types ───────────────────────────────────────────────────────────────────

export interface SchemaState {
  /** The list of root-level fields in the response payload schema */
  fields: SchemaField[];
}

export interface SchemaActions {
  /** Replaces the entire schema field list with a new tree */
  setSchema: (fields: SchemaField[]) => void;
  /** Adds a new field. If parentId is specified, adds it as a child of that object */
  addField: (parentId?: string) => void;
  /** Removes a field from the tree by ID */
  removeField: (id: string) => void;
  /** Updates properties of a field by ID */
  updateField: (id: string, updates: Partial<Omit<SchemaField, "id">>) => void;
  /** Resets the schema to an empty array */
  resetSchema: () => void;
  /** Moves a field up or down within its sibling array context */
  moveField: (id: string, direction: "up" | "down") => void;
  /** Reorders fields by dragging one sibling field onto another sibling field */
  reorderField: (draggedId: string, targetId: string) => void;
}

export type SchemaStore = SchemaState & SchemaActions;

// ─── Store Factory ───────────────────────────────────────────────────────────

/**
 * Creates a new, isolated Zustand store instance for managing a route's payload schema.
 * Implements the per-request store factory pattern using Immer middleware
 * to allow direct mutations on deeply nested tree structures.
 */
export const createSchemaStore = (initialFields: SchemaField[] = []) => {
  return createStore<SchemaStore>()(
    immer((set) => ({
      fields: initialFields,

      setSchema: (fields) =>
        set((state) => {
          state.fields = fields;
        }),

      resetSchema: () =>
        set((state) => {
          state.fields = [];
        }),

      addField: (parentId) =>
        set((state) => {
          const newField: SchemaField = {
            id: `field-${generateId(6)}`,
            name: `field_${state.fields.length + 1}`,
            type: "string",
            nullable: false,
          };

          if (!parentId) {
            // Add to root level
            state.fields.push(newField);
            return;
          }

          // Recursive helper to find the parent and insert the child
          const addToParent = (tree: SchemaField[]): boolean => {
            for (const field of tree) {
              if (field.id === parentId) {
                if (field.type === "object") {
                  field.children = field.children ?? [];
                  field.children.push(newField);
                  return true;
                }
                if (field.type === "array" && field.arrayItemType === "object") {
                  field.arrayItemChildren = field.arrayItemChildren ?? [];
                  field.arrayItemChildren.push(newField);
                  return true;
                }
                return false;
              }
              if (field.children && addToParent(field.children)) return true;
              if (field.arrayItemChildren && addToParent(field.arrayItemChildren)) return true;
            }
            return false;
          };

          addToParent(state.fields);
        }),

      removeField: (id) =>
        set((state) => {
          // Recursive helper to filter out the target node
          const filterTree = (tree: SchemaField[]): SchemaField[] => {
            return tree
              .filter((node) => node.id !== id)
              .map((node) => {
                if (node.children) {
                  node.children = filterTree(node.children);
                }
                if (node.arrayItemChildren) {
                  node.arrayItemChildren = filterTree(node.arrayItemChildren);
                }
                return node;
              });
          };

          state.fields = filterTree(state.fields);
        }),

      updateField: (id, updates) =>
        set((state) => {
          // Recursive helper to find the node and apply updates
          const updateInTree = (tree: SchemaField[]): boolean => {
            for (const field of tree) {
              if (field.id === id) {
                // Apply the updates directly (Immer handles immutability)
                Object.assign(field, updates);

                // Initialize arrays or objects if type changes
                if (updates.type === "object" && !field.children) {
                  field.children = [];
                  field.fakerProvider = undefined; // Primitives are mutually exclusive with objects
                }
                if (updates.type === "array" && !field.arrayItemType) {
                  field.arrayItemType = "string";
                  field.fakerProvider = undefined;
                }
                if (updates.arrayItemType === "object" && !field.arrayItemChildren) {
                  field.arrayItemChildren = [];
                  field.arrayItemFakerProvider = undefined;
                }
                return true;
              }
              if (field.children && updateInTree(field.children)) return true;
              if (field.arrayItemChildren && updateInTree(field.arrayItemChildren)) return true;
            }
            return false;
          };

          updateInTree(state.fields);
        }),

      moveField: (id, direction) =>
        set((state) => {
          const moveInArray = (array: SchemaField[]): boolean => {
            const index = array.findIndex((field) => field.id === id);
            if (index !== -1) {
              if (direction === "up" && index > 0) {
                const temp = array[index];
                array[index] = array[index - 1];
                array[index - 1] = temp;
                return true;
              }
              if (direction === "down" && index < array.length - 1) {
                const temp = array[index];
                array[index] = array[index + 1];
                array[index + 1] = temp;
                return true;
              }
              return false;
            }

            for (const field of array) {
              if (field.children && moveInArray(field.children)) return true;
              if (field.arrayItemChildren && moveInArray(field.arrayItemChildren)) return true;
            }
            return false;
          };

          moveInArray(state.fields);
        }),

      reorderField: (draggedId, targetId) =>
        set((state) => {
          if (draggedId === targetId) return;

          const findContainingArray = (array: SchemaField[], id: string): SchemaField[] | null => {
            const index = array.findIndex((field) => field.id === id);
            if (index !== -1) return array;

            for (const field of array) {
              if (field.children) {
                const foundInChildren = findContainingArray(field.children, id);
                if (foundInChildren) return foundInChildren;
              }
              if (field.arrayItemChildren) {
                const foundInArrayItems = findContainingArray(field.arrayItemChildren, id);
                if (foundInArrayItems) return foundInArrayItems;
              }
            }

            return null;
          };

          const sourceArray = findContainingArray(state.fields, draggedId);
          const targetArray = findContainingArray(state.fields, targetId);
          if (!sourceArray || !targetArray || sourceArray !== targetArray) return;

          const fromIndex = sourceArray.findIndex((field) => field.id === draggedId);
          const toIndex = targetArray.findIndex((field) => field.id === targetId);
          if (fromIndex === -1 || toIndex === -1 || fromIndex === toIndex) return;

          const [draggedField] = sourceArray.splice(fromIndex, 1);
          const adjustedIndex = fromIndex < toIndex ? toIndex - 1 : toIndex;
          sourceArray.splice(adjustedIndex, 0, draggedField);
        }),
    }))
  );
};
