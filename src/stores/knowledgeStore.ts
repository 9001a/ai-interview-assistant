'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { KnowledgeDocument } from '@/types';
import { cosineSimilarity, getEmbedding } from '@/lib/embedding';

interface KnowledgeState {
  documents: KnowledgeDocument[];
  addDocument: (doc: Omit<KnowledgeDocument, 'id' | 'createdAt'>) => Promise<string>;
  deleteDocument: (id: string) => void;
  updateDocument: (id: string, updates: Partial<KnowledgeDocument>) => void;
  getDocumentById: (id: string) => KnowledgeDocument | undefined;
  
  // RAG 相关功能
  generateEmbedding: (id: string) => Promise<void>; // 为文档生成向量
  searchByVector: (query: string, topK?: number) => Promise<RetrievalResult[]>; // 向量搜索
  searchByKeyword: (query: string) => RetrievalResult[]; // 关键词搜索
  hybridSearch: (query: string, topK?: number) => Promise<RetrievalResult[]>; // 混合搜索
}

// 检索结果
export interface RetrievalResult {
  id: string;
  title: string;
  content: string;
  sourceType: KnowledgeDocument['sourceType'];
  score: number;
  searchType: 'vector' | 'keyword' | 'hybrid';
  metadata?: Record<string, any>;
}

export const useKnowledgeStore = create<KnowledgeState>()(
  persist(
    (set, get) => ({
      documents: [],
      
      addDocument: async (doc) => {
        const id = `doc_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        
        // 如果有内容，自动生成向量
        let embedding: number[] | undefined;
        if (doc.content) {
          try {
            embedding = await getEmbedding(doc.content);
          } catch (error) {
            console.error('[KnowledgeStore] Failed to generate embedding:', error);
          }
        }
        
        const newDoc: KnowledgeDocument = {
          ...doc,
          id,
          embedding,
          embeddingUpdatedAt: embedding ? new Date().toISOString() : undefined,
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
      
      // 为文档生成向量
      generateEmbedding: async (id) => {
        const doc = get().getDocumentById(id);
        if (!doc || !doc.content) return;
        
        try {
          const embedding = await getEmbedding(doc.content);
          get().updateDocument(id, {
            embedding,
            embeddingUpdatedAt: new Date().toISOString(),
          });
          console.log('[KnowledgeStore] Embedding generated for:', doc.title);
        } catch (error) {
          console.error('[KnowledgeStore] Failed to generate embedding:', error);
        }
      },
      
      // 向量搜索 (Dense Retrieval)
      searchByVector: async (query, topK = 5) => {
        const { documents } = get();
        
        // 过滤出有向量的文档
        const docsWithEmbedding = documents.filter(d => d.embedding && d.content);
        
        if (docsWithEmbedding.length === 0) {
          return [];
        }
        
        try {
          // 生成查询向量
          const queryEmbedding = await getEmbedding(query);
          
          // 计算相似度
          const scored = docsWithEmbedding.map(doc => ({
            doc,
            score: cosineSimilarity(queryEmbedding, doc.embedding!),
          }));
          
          // 排序并返回前 K 个
          return scored
            .sort((a, b) => b.score - a.score)
            .slice(0, topK)
            .map(({ doc, score }) => ({
              id: doc.id!,
              title: doc.title,
              content: doc.content!,
              sourceType: doc.sourceType,
              score,
              searchType: 'vector' as const,
              metadata: {
                originalFilename: doc.originalFilename,
                createdAt: doc.createdAt,
              },
            }));
        } catch (error) {
          console.error('[KnowledgeStore] Vector search error:', error);
          return [];
        }
      },
      
      // 关键词搜索 (Sparse Retrieval - BM25 简化版)
      searchByKeyword: (query) => {
        const { documents } = get();
        const queryTerms = query.toLowerCase().split(/\s+/).filter(Boolean);
        
        if (queryTerms.length === 0) return [];
        
        const scored = documents
          .filter(d => d.content)
          .map(doc => {
            const content = (doc.title + ' ' + doc.content!).toLowerCase();
            
            // 计算匹配分数 (简化 BM25)
            let score = 0;
            queryTerms.forEach(term => {
              const regex = new RegExp(term, 'g');
              const matches = content.match(regex);
              if (matches) {
                score += matches.length;
              }
            });
            
            // 标题匹配加权
            const titleLower = doc.title.toLowerCase();
            queryTerms.forEach(term => {
              if (titleLower.includes(term)) {
                score += 5;
              }
            });
            
            return { doc, score };
          })
          .filter(({ score }) => score > 0);
        
        return scored
          .sort((a, b) => b.score - a.score)
          .map(({ doc, score }) => ({
            id: doc.id!,
            title: doc.title,
            content: doc.content!,
            sourceType: doc.sourceType,
            score,
            searchType: 'keyword' as const,
            metadata: {
              originalFilename: doc.originalFilename,
              createdAt: doc.createdAt,
            },
          }));
      },
      
      // 混合搜索 (Dense + Sparse + RRF 融合)
      hybridSearch: async (query, topK = 5) => {
        const [vectorResults, keywordResults] = await Promise.all([
          get().searchByVector(query, topK * 2),
          get().searchByKeyword(query),
        ]);
        
        // RRF (Reciprocal Rank Fusion)
        const k = 60; // RRF 常数
        const scores = new Map<string, { result: RetrievalResult; rrfScore: number }>();
        
        // 合并向量搜索结果
        vectorResults.forEach((result, index) => {
          const rank = index + 1;
          const existing = scores.get(result.id);
          if (existing) {
            existing.rrfScore += 1 / (k + rank);
          } else {
            scores.set(result.id, {
              result: { ...result, searchType: 'hybrid' },
              rrfScore: 1 / (k + rank),
            });
          }
        });
        
        // 合并关键词搜索结果
        keywordResults.forEach((result, index) => {
          const rank = index + 1;
          const existing = scores.get(result.id);
          if (existing) {
            existing.rrfScore += 1 / (k + rank);
          } else {
            scores.set(result.id, {
              result: { ...result, searchType: 'hybrid' },
              rrfScore: 1 / (k + rank),
            });
          }
        });
        
        // 按 RRF 分数排序
        return Array.from(scores.values())
          .sort((a, b) => b.rrfScore - a.rrfScore)
          .slice(0, topK)
          .map(({ result, rrfScore }) => ({
            ...result,
            score: rrfScore,
          }));
      },
    }),
    {
      name: 'knowledge-storage',
    }
  )
);
