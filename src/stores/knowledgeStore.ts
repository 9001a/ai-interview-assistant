'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { KnowledgeDocument, KnowledgeChunk, KnowledgeSegment } from '@/types';
import { cosineSimilarity, getEmbedding } from '@/lib/embedding';
import { chunkDocument, generateDocumentSummary } from '@/lib/chunking';

interface KnowledgeState {
  documents: KnowledgeDocument[];
  
  // CRUD 操作
  addDocument: (doc: Omit<KnowledgeDocument, 'id' | 'createdAt' | 'chunks' | 'summary'>) => Promise<string>;
  deleteDocument: (id: string) => void;
  updateDocument: (id: string, updates: Partial<KnowledgeDocument>) => void;
  getDocumentById: (id: string) => KnowledgeDocument | undefined;
  
  // 三级检索功能（核心）
  // 三级检索：只匹配片段，返回完整段落作为上下文
  retrieveSegments: (query: string, documentIds: string[], topK?: number) => Promise<SegmentRetrievalResult[]>;
  
  // 获取片段的完整上下文（父段落）
  getSegmentContext: (documentId: string, segmentId: string) => {
    segment: KnowledgeSegment | undefined;
    chunk: KnowledgeChunk | undefined;
    document: KnowledgeDocument | undefined;
  };
}

// 片段检索结果（三级检索）
export interface SegmentRetrievalResult {
  documentId: string;
  documentTitle: string;
  chunkId: string;
  chunkContent: string;      // 完整段落内容（给 AI 的上下文）
  chunkSummary: string;
  segmentId: string;
  segmentContent: string;    // 匹配到的片段内容
  score: number;             // 相似度分数
}

export const useKnowledgeStore = create<KnowledgeState>()(
  persist(
    (set, get) => ({
      documents: [],
      
      // 添加文档 - 自动切分并生成向量
      addDocument: async (doc) => {
        const id = `doc_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        
        // 1. 切分文档为二级段落块和三级片段
        const chunks = chunkDocument(doc.content);
        
        // 2. 为所有三级片段生成向量
        console.log('[KnowledgeStore] 开始为文档生成向量:', doc.title);
        const chunksWithEmbedding: KnowledgeChunk[] = [];
        
        for (const chunk of chunks) {
          const segmentsWithEmbedding: KnowledgeSegment[] = [];
          
          for (const segment of chunk.segments) {
            try {
              const embedding = await getEmbedding(segment.content);
              segmentsWithEmbedding.push({
                ...segment,
                embedding,
              });
              console.log('[KnowledgeStore] 片段向量生成成功:', segment.content.slice(0, 30) + '...');
            } catch (error) {
              console.error('[KnowledgeStore] 片段向量生成失败:', error);
              // 即使失败也保留片段，只是没有向量
              segmentsWithEmbedding.push(segment as KnowledgeSegment);
            }
          }
          
          chunksWithEmbedding.push({
            ...chunk,
            segments: segmentsWithEmbedding,
          });
        }
        
        // 3. 生成文档摘要
        const summary = generateDocumentSummary(doc.content);
        
        const newDoc: KnowledgeDocument = {
          ...doc,
          id,
          summary,
          chunks: chunksWithEmbedding,
          createdAt: new Date().toISOString(),
        };
        
        set((state) => ({
          documents: [newDoc, ...state.documents],
        }));
        
        console.log('[KnowledgeStore] 文档添加完成:', {
          title: doc.title,
          chunkCount: chunksWithEmbedding.length,
          totalSegments: chunksWithEmbedding.reduce((sum, c) => sum + c.segments.length, 0),
        });
        
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
      
      // 核心：三级检索（只匹配片段，返回完整段落）
      retrieveSegments: async (query, documentIds, topK = 5) => {
        const { documents } = get();
        
        // 过滤指定文档
        const targetDocs = documents.filter(d => d.id && documentIds.includes(d.id));
        
        if (targetDocs.length === 0) {
          console.log('[KnowledgeStore] 未找到指定文档');
          return [];
        }
        
        // 收集所有有向量的片段
        const segmentsWithDoc: Array<{
          segment: KnowledgeSegment;
          chunk: KnowledgeChunk;
          document: KnowledgeDocument;
        }> = [];
        
        for (const doc of targetDocs) {
          for (const chunk of doc.chunks || []) {
            for (const segment of chunk.segments || []) {
              if (segment.embedding) {
                segmentsWithDoc.push({ segment, chunk, document: doc });
              }
            }
          }
        }
        
        if (segmentsWithDoc.length === 0) {
          console.log('[KnowledgeStore] 文档中无可用的向量片段');
          return [];
        }
        
        console.log('[KnowledgeStore] 开始检索，总片段数:', segmentsWithDoc.length);
        
        try {
          // 生成查询向量
          const queryEmbedding = await getEmbedding(query);
          
          // 计算所有片段的相似度
          const scored = segmentsWithDoc.map(({ segment, chunk, document }) => ({
            segment,
            chunk,
            document,
            score: cosineSimilarity(queryEmbedding, segment.embedding!),
          }));
          
          // 排序并取 Top-K
          const topResults = scored
            .sort((a, b) => b.score - a.score)
            .slice(0, topK);
          
          console.log('[KnowledgeStore] 检索完成，Top-K 结果:', topResults.length);
          
          // 返回结果（包含完整段落作为上下文）
          return topResults.map(({ segment, chunk, document, score }) => ({
            documentId: document.id || '',  // 确保是 string
            documentTitle: document.title || '未命名文档',  // 处理 undefined 情况
            chunkId: chunk.id,
            chunkContent: chunk.content,      // 完整段落给 AI
            chunkSummary: chunk.summary,
            segmentId: segment.id,
            segmentContent: segment.content,  // 匹配片段
            score,
          }));
          
        } catch (error) {
          console.error('[KnowledgeStore] 向量检索失败:', error);
          return [];
        }
      },
      
      // 获取片段的完整上下文
      getSegmentContext: (documentId, segmentId) => {
        const document = get().getDocumentById(documentId);
        if (!document) return { segment: undefined, chunk: undefined, document: undefined };
        
        for (const chunk of document.chunks || []) {
          const segment = chunk.segments?.find(s => s.id === segmentId);
          if (segment) {
            return { segment, chunk, document };
          }
        }
        
        return { segment: undefined, chunk: undefined, document: undefined };
      },
    }),
    {
      name: 'knowledge-storage',
      partialize: (state) => ({ documents: state.documents }),
    }
  )
);
