"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";

interface ProjectPageState {
  projectId: string | null;
  activeTab: string;
}

interface ProjectContextType {
  state: ProjectPageState;
  setProjectPage: (projectId: string, tab?: string) => void;
  clearProjectPage: () => void;
}

const defaultState: ProjectPageState = { projectId: null, activeTab: "review" };

const ProjectContext = createContext<ProjectContextType>({
  state: defaultState,
  setProjectPage: () => {},
  clearProjectPage: () => {},
});

export function ProjectProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<ProjectPageState>(() => {
    try {
      const saved = sessionStorage.getItem("last_project");
      if (saved) {
        const parsed = JSON.parse(saved);
        return { projectId: parsed.id || null, activeTab: parsed.tab || "review" };
      }
    } catch (e) {}
    return defaultState;
  });

  useEffect(() => {
    if (state.projectId) {
      sessionStorage.setItem("last_project", JSON.stringify({ id: state.projectId, tab: state.activeTab }));
    }
  }, [state]);

  const setProjectPage = useCallback((projectId: string, tab?: string) => {
    setState({ projectId, activeTab: tab || "review" });
  }, []);

  const clearProjectPage = useCallback(() => {
    setState(defaultState);
    sessionStorage.removeItem("last_project");
  }, []);

  return (
    <ProjectContext.Provider value={{ state, setProjectPage, clearProjectPage }}>
      {children}
    </ProjectContext.Provider>
  );
}

export function useProjectContext() {
  return useContext(ProjectContext);
}