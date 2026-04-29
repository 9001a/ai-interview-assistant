'use client';

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { Resume } from '@/types';

interface ResumeState {
  resumes: Resume[];
  
  // Actions
  addResume: (resume: Resume) => void;
  updateResume: (id: string, updates: Partial<Resume>) => void;
  deleteResume: (id: string) => void;
  getResumeById: (id: string) => Resume | undefined;
}

export const useResumeStore = create<ResumeState>()(
  persist(
    (set, get) => ({
      resumes: [],
      
      addResume: (resume: Resume) => {
        set((state) => ({
          resumes: [resume, ...state.resumes],
        }));
      },
      
      updateResume: (id: string, updates: Partial<Resume>) => {
        set((state) => ({
          resumes: state.resumes.map((resume) =>
            resume.id === id ? { ...resume, ...updates, updatedAt: new Date().toISOString() } : resume
          ),
        }));
      },
      
      deleteResume: (id: string) => {
        set((state) => ({
          resumes: state.resumes.filter((resume) => resume.id !== id),
        }));
      },
      
      getResumeById: (id: string) => {
        return get().resumes.find((resume) => resume.id === id);
      },
    }),
    {
      name: 'resume-store',
      storage: createJSONStorage(() => localStorage),
    }
  )
);
