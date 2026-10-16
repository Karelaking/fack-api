"use client";

import * as React from "react";
import { useStore } from "zustand";
import {
  createAgentStore,
  type AgentActions,
  type AgentStoreApi,
  type AgentStore,
} from "./agent-store";

const AgentStoreContext = React.createContext<AgentStoreApi | undefined>(
  undefined,
);

interface AgentStoreProviderProps {
  projectId: string;
  children: React.ReactNode;
}

/**
 * Provides one agent session per mounted project workspace.
 *
 * The store is created during render (not module scope) so concurrent renders
 * never share a run, mirroring `SchemaStoreProvider`.
 */
export const AgentStoreProvider = ({
  projectId,
  children,
}: AgentStoreProviderProps): React.JSX.Element => {
  const [store] = React.useState(() => createAgentStore(projectId));

  return (
    <AgentStoreContext.Provider value={store}>
      {children}
    </AgentStoreContext.Provider>
  );
};

function useAgentStoreApi(): AgentStoreApi {
  const store = React.useContext(AgentStoreContext);
  if (!store) {
    throw new Error("useAgentStore must be used inside an AgentStoreProvider");
  }
  return store;
}

/** Subscribes to a slice of the agent session. */
export function useAgentStore<T>(selector: (state: AgentStore) => T): T {
  return useStore(useAgentStoreApi(), selector);
}

/** Returns the stable action set, which never changes identity. */
export function useAgentActions(): AgentActions {
  const store = useAgentStoreApi();

  return React.useMemo(() => {
    const state = store.getState();
    return {
      setPrompt: state.setPrompt,
      startRun: state.startRun,
      retry: state.retry,
      cancel: state.cancel,
      reset: state.reset,
      setResolution: state.setResolution,
      applyChanges: state.applyChanges,
    };
  }, [store]);
}
