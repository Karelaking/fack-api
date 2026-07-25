"use client";

import * as React from "react";

/**
 * Minimal project shape passed through context from the layout.
 * Uses the inferred type from the projects table schema.
 */
export interface ProjectContextValue {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  isLoggingEnabled: boolean;
  isCachingEnabled: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const ProjectContext = React.createContext<ProjectContextValue | null>(null);

/**
 * Hook to access the current project from context.
 * Throws if used outside a ProjectProvider — guarantees non-null return.
 */
export function useProject(): ProjectContextValue {
  const ctx = React.useContext(ProjectContext);
  if (!ctx) {
    throw new Error("useProject must be used within a <ProjectProvider>");
  }
  return ctx;
}

/**
 * Server-rendered provider that passes the validated project down to client
 * components without prop drilling through every subpage.
 */
export function ProjectProvider({
  project,
  children,
}: {
  project: ProjectContextValue;
  children: React.ReactNode;
}) {
  return (
    <ProjectContext.Provider value={project}>
      {children}
    </ProjectContext.Provider>
  );
}
