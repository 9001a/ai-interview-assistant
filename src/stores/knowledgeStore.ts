'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { KnowledgeDocument } from '@/types';

interface KnowledgeState {
  documents: KnowledgeDocument[];
  addDocument: (doc: Omit<KnowledgeDocument, 'id' | 'createdAt'>) => string;
  deleteDocument: (id: string) => void;
  updateDocument: (id: string, updates: Partial<KnowledgeDocument>) => void;
  getDocumentById: (id: string) => KnowledgeDocument | undefined;
}

export const useKnowledgeStore = create<KnowledgeState>()(
  persist(
    (set, get) => ({
      documents: [],
      
      addDocument: (doc) => {
        const id = `doc_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        const newDoc: KnowledgeDocument = {
          ...doc,
          id,
          createdAt: new Date().toISOString(),
        };
        set((state) => ({
          documents: [newDoc, ...state.documents],
        }));
        return id;
      },
      
      deleteDocument: (id) => {
        set((state) => ({
          documents: state.documents.filter((d) => d.id !== id),
        }));
      },
      
      updateDocument: (id, updates) => {
        set((state) => ({
          documents: state.documents.map((d) =>
            d.id === id ? { ...d, ...updates } : d
          ),
        }));
      },
      
      getDocumentById: (id) => {
        return get().documents.find((d) => d.id === id);
      },
    }),
    {
      name: 'knowledge-storage',
    }
  )
);
