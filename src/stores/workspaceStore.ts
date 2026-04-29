import { create } from 'zustand';
import { Workspace, WorkspaceType, WorkspaceJD, WorkspaceResume, WorkspaceOptimization } from '@/types';

interface WorkspaceState {
  workspaces: Workspace[];
  currentWorkspace: Workspace | null;
  selectedJDs: string[];
  selectedResume: WorkspaceResume | null;

  // Actions
  setWorkspaces: (workspaces: Workspace[]) => void;
  setCurrentWorkspace: (workspace: Workspace | null) => void;
  createWorkspace: (name: string, type: WorkspaceType) => Workspace;
  updateWorkspace: (id: string, updates: Partial<Workspace>) => void;
  deleteWorkspace: (id: string) => void;

  // JD Actions
  addJDToWorkspace: (workspaceId: string, jd: Omit<WorkspaceJD, 'id' | 'createdAt'>) => void;
  removeJDFromWorkspace: (workspaceId: string, jdId: string) => void;
  selectJD: (jdId: string) => void;
  deselectJD: (jdId: string) => void;
  clearJDSelection: () => void;

  // Resume Actions
  addResumeToWorkspace: (workspaceId: string, resume: Omit<WorkspaceResume, 'id' | 'createdAt'>) => void;
  removeResumeFromWorkspace: (workspaceId: string, resumeId: string) => void;
  selectResume: (resume: WorkspaceResume | null) => void;

  // Optimization Actions
  addOptimization: (workspaceId: string, optimization: Omit<WorkspaceOptimization, 'id' | 'createdAt'>) => void;

  // Utility
  getSelectedJDs: () => WorkspaceJD[];
  reset: () => void;
}

const generateId = () => Math.random().toString(36).substring(2, 9);

export const useWorkspaceStore = create<WorkspaceState>((set, get) => ({
  workspaces: [],
  currentWorkspace: null,
  selectedJDs: [],
  selectedResume: null,

  setWorkspaces: (workspaces) => set({ workspaces }),

  setCurrentWorkspace: (workspace) => {
    set({
      currentWorkspace: workspace,
      selectedJDs: [],
      selectedResume: null
    });
  },

  createWorkspace: (name, type) => {
    const workspace: Workspace = {
      id: generateId(),
      userId: '', // Will be set when user creates
      name,
      type,
      jdList: [],
      resumes: [],
      optimizations: [],
      status: 'idle',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    set((state) => ({
      workspaces: [workspace, ...state.workspaces],
      currentWorkspace: workspace,
    }));

    return workspace;
  },

  updateWorkspace: (id, updates) => {
    set((state) => ({
      workspaces: state.workspaces.map((w) =>
        w.id === id ? { ...w, ...updates, updatedAt: new Date().toISOString() } : w
      ),
      currentWorkspace: state.currentWorkspace?.id === id
        ? { ...state.currentWorkspace, ...updates, updatedAt: new Date().toISOString() }
        : state.currentWorkspace,
    }));
  },

  deleteWorkspace: (id) => {
    set((state) => ({
      workspaces: state.workspaces.filter((w) => w.id !== id),
      currentWorkspace: state.currentWorkspace?.id === id ? null : state.currentWorkspace,
    }));
  },

  // JD Actions
  addJDToWorkspace: (workspaceId, jd) => {
    const newJD: WorkspaceJD = {
      ...jd,
      id: generateId(),
      createdAt: new Date().toISOString(),
    };

    set((state) => {
      const updatedWorkspaces = state.workspaces.map((w) =>
        w.id === workspaceId
          ? { ...w, jdList: [newJD, ...w.jdList], updatedAt: new Date().toISOString() }
          : w
      );

      return {
        workspaces: updatedWorkspaces,
        currentWorkspace: state.currentWorkspace?.id === workspaceId
          ? { ...state.currentWorkspace, jdList: [newJD, ...state.currentWorkspace.jdList] }
          : state.currentWorkspace,
      };
    });
  },

  removeJDFromWorkspace: (workspaceId, jdId) => {
    set((state) => {
      const updatedWorkspaces = state.workspaces.map((w) =>
        w.id === workspaceId
          ? { ...w, jdList: w.jdList.filter((jd) => jd.id !== jdId), updatedAt: new Date().toISOString() }
          : w
      );

      return {
        workspaces: updatedWorkspaces,
        currentWorkspace: state.currentWorkspace?.id === workspaceId
          ? { ...state.currentWorkspace, jdList: state.currentWorkspace.jdList.filter((jd) => jd.id !== jdId) }
          : state.currentWorkspace,
      };
    });
  },

  selectJD: (jdId) => {
    set((state) => ({
      selectedJDs: state.selectedJDs.includes(jdId)
        ? state.selectedJDs
        : [...state.selectedJDs, jdId],
    }));
  },

  deselectJD: (jdId) => {
    set((state) => ({
      selectedJDs: state.selectedJDs.filter((id) => id !== jdId),
    }));
  },

  clearJDSelection: () => set({ selectedJDs: [] }),

  // Resume Actions
  addResumeToWorkspace: (workspaceId, resume) => {
    const newResume: WorkspaceResume = {
      ...resume,
      id: generateId(),
      createdAt: new Date().toISOString(),
    };

    set((state) => {
      const updatedWorkspaces = state.workspaces.map((w) =>
        w.id === workspaceId
          ? { ...w, resumes: [newResume, ...w.resumes], updatedAt: new Date().toISOString() }
          : w
      );

      return {
        workspaces: updatedWorkspaces,
        currentWorkspace: state.currentWorkspace?.id === workspaceId
          ? { ...state.currentWorkspace, resumes: [newResume, ...state.currentWorkspace.resumes] }
          : state.currentWorkspace,
        selectedResume: newResume,
      };
    });
  },

  removeResumeFromWorkspace: (workspaceId, resumeId) => {
    set((state) => {
      const updatedWorkspaces = state.workspaces.map((w) =>
        w.id === workspaceId
          ? { ...w, resumes: w.resumes.filter((r) => r.id !== resumeId), updatedAt: new Date().toISOString() }
          : w
      );

      return {
        workspaces: updatedWorkspaces,
        currentWorkspace: state.currentWorkspace?.id === workspaceId
          ? { ...state.currentWorkspace, resumes: state.currentWorkspace.resumes.filter((r) => r.id !== resumeId) }
          : state.currentWorkspace,
        selectedResume: state.selectedResume?.id === resumeId ? null : state.selectedResume,
      };
    });
  },

  selectResume: (resume) => set({ selectedResume: resume }),

  // Optimization Actions
  addOptimization: (workspaceId, optimization) => {
    const newOptimization: WorkspaceOptimization = {
      ...optimization,
      id: generateId(),
      createdAt: new Date().toISOString(),
    };

    set((state) => {
      const updatedWorkspaces = state.workspaces.map((w) =>
        w.id === workspaceId
          ? { ...w, optimizations: [newOptimization, ...w.optimizations], updatedAt: new Date().toISOString() }
          : w
      );

      return {
        workspaces: updatedWorkspaces,
        currentWorkspace: state.currentWorkspace?.id === workspaceId
          ? { ...state.currentWorkspace, optimizations: [newOptimization, ...state.currentWorkspace.optimizations] }
          : state.currentWorkspace,
      };
    });
  },

  getSelectedJDs: () => {
    const { currentWorkspace, selectedJDs } = get();
    if (!currentWorkspace) return [];
    return currentWorkspace.jdList.filter((jd) => selectedJDs.includes(jd.id));
  },

  reset: () => set({
    workspaces: [],
    currentWorkspace: null,
    selectedJDs: [],
    selectedResume: null,
  }),
}));
