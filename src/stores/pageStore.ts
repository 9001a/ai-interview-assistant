import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { HistoryRecord } from '@/types';

type PageType = 'workspace' | 'jd' | 'resume' | 'interview' | 'interview_report' | 'history' | 'history_chat' | 'knowledge' | 'jd_resume' | 'settings';

interface PageStore {
  currentPage: PageType;
  currentInterviewId: string | null;
  currentInterviewWorkspaceId: string | null;
  currentHistoryRecord: HistoryRecord | null;
  setCurrentPage: (page: PageType) => void;
  setCurrentInterview: (interviewId: string | null, workspaceId?: string | null) => void;
  setCurrentHistoryRecord: (record: HistoryRecord | null) => void;
}

export const usePageStore = create<PageStore>()(
  persist(
    (set) => ({
      currentPage: 'workspace',
      currentInterviewId: null,
      currentInterviewWorkspaceId: null,
      currentHistoryRecord: null,
      setCurrentPage: (page) => set({ currentPage: page }),
      setCurrentInterview: (interviewId, workspaceId = null) => set({ 
        currentInterviewId: interviewId, 
        currentInterviewWorkspaceId: workspaceId 
      }),
      setCurrentHistoryRecord: (record) => set({ currentHistoryRecord: record }),
    }),
    {
      name: 'page-storage',
    }
  )
);
