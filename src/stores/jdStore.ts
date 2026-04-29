'use client';

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { JDAnalysis } from '@/types';

interface JDState {
  jdList: JDAnalysis[];
  
  // Actions
  addJD: (jd: JDAnalysis) => void;
  updateJD: (id: string, updates: Partial<JDAnalysis>) => void;
  deleteJD: (id: string) => void;
  getJDById: (id: string) => JDAnalysis | undefined;
}

export const useJDStore = create<JDState>()(
  persist(
    (set, get) => ({
      jdList: [],
      
      addJD: (jd: JDAnalysis) => {
        set((state) => ({
          jdList: [jd, ...state.jdList],
        }));
      },
      
      updateJD: (id: string, updates: Partial<JDAnalysis>) => {
        set((state) => ({
          jdList: state.jdList.map((jd) =>
            jd.id === id ? { ...jd, ...updates, updatedAt: new Date().toISOString() } : jd
          ),
        }));
      },
      
      deleteJD: (id: string) => {
        set((state) => ({
          jdList: state.jdList.filter((jd) => jd.id !== id),
        }));
      },
      
      getJDById: (id: string) => {
        return get().jdList.find((jd) => jd.id === id);
      },
    }),
    {
      name: 'jd-store',
      storage: createJSONStorage(() => localStorage),
    }
  )
);
