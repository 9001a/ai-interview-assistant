import { create } from 'zustand';
import { persist } from 'zustand/middleware';

type PageType = 'workspace' | 'jd' | 'resume' | 'interview' | 'history' | 'knowledge' | 'settings';

interface PageStore {
  currentPage: PageType;
  setCurrentPage: (page: PageType) => void;
}

export const usePageStore = create<PageStore>()(
  persist(
    (set) => ({
      currentPage: 'workspace',
      setCurrentPage: (page) => set({ currentPage: page }),
    }),
    {
      name: 'page-storage',
    }
  )
);
