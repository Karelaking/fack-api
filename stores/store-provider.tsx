"use client";

import * as React from "react";
import type { StoreApi } from "zustand";
import { useStore } from "zustand";
import { createSchemaStore, type SchemaStore } from "./schema-store";
import type { SchemaField } from "@/lib/schema-synthesizer";

// ─── React Context ───────────────────────────────────────────────────────────

const SchemaStoreContext = React.createContext<StoreApi<SchemaStore> | null>(null);

interface SchemaStoreProviderProps {
  initialFields?: SchemaField[];
  children: React.ReactNode;
}

/**
 * SSR-safe Zustand Store Provider.
 * Instantiates a new schema store instance per-request to prevent global state
 * leakages during Concurrent Server Side Rendering.
 *
 * @see https://zustand.docs.pmnd.rs/learn/guides/nextjs
 */
export function SchemaStoreProvider({
  initialFields = [],
  children,
}: SchemaStoreProviderProps) {
  const [store] = React.useState(() => createSchemaStore(initialFields));

  return (
    <SchemaStoreContext.Provider value={store}>
      {children}
    </SchemaStoreContext.Provider>
  );
}

/**
 * Custom React Hook to access values and actions of the Schema Store.
 *
 * @param selector - Selector function mapping store state to desired components
 * @returns Selected slice of the Zustand state store
 *
 * @example
 * ```ts
 * const fields = useSchemaStore((state) => state.fields);
 * const addField = useSchemaStore((state) => state.addField);
 * ```
 */
export function useSchemaStore<T>(selector: (store: SchemaStore) => T): T {
  const context = React.useContext(SchemaStoreContext);
  if (!context) {
    throw new Error("useSchemaStore must be used within a SchemaStoreProvider");
  }
  return useStore(context, selector);
}
