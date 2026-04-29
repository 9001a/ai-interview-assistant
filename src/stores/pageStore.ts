import { create } from 'zustand';
import { persist } from 'zustand/middleware';

type PageType = 'workspace' | 'jd' | 'resume' | 'interview' | 'history' | 'knowledge' | 'settings';

interface PageStore {
  currentPage: PageType;
  currentInterviewId: string | null;
  currentInterviewWorkspaceId: string | null;
  setCurrentPage: (page: PageType) => void;
  setCurrentInterview: (interviewId: string | null, workspaceId?: string | null) => void;
}

export const usePageStore = create<PageStore>()(
  persist(
    (set) => ({
      currentPage: 'workspace',
      currentInterviewId: null,
      currentInterviewWorkspaceId: null,
      setCurrentPage: (page) => set({ currentPage: page }),
      setCurrentInterview: (interviewId, workspaceId = null) => set({ 
        currentInterviewId: interviewId, 
        currentInterviewWorkspaceId: workspaceId 
      }),
    }),
    {
      name: 'page-storage',
    }
  )
);
