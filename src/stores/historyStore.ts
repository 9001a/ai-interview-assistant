'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { HistoryRecord, HistoryRecordType, JDAnalysis, Resume, WorkspaceOptimization, WorkspaceInterview } from '@/types';

interface HistoryStore {
  records: HistoryRecord[];
  
  // 操作
  addRecord: (record: Omit<HistoryRecord, 'id' | 'createdAt' | 'updatedAt'>) => void;
  addJDAnalysisRecord: (jd: JDAnalysis, source: 'workspace' | 'quick', workspaceId?: string, workspaceName?: string) => void;
  addResumeOptimizationRecord: (original: Resume, optimized: WorkspaceOptimization, source: 'workspace' | 'quick', workspaceId?: string, workspaceName?: string) => void;
  addInterviewRecord: (interview: any, source: 'workspace' | 'quick', workspaceId?: string, workspaceName?: string) => void;
  removeRecord: (id: string) => void;
  clearRecords: () => void;
  
  // 查询
  getRecordsByType: (type: HistoryRecordType) => HistoryRecord[];
  getRecordsBySource: (source: 'workspace' | 'quick') => HistoryRecord[];
  getRecordsByWorkspace: (workspaceId: string) => HistoryRecord[];
}

export const useHistoryStore = create<HistoryStore>()(
  persist(
    (set, get) => ({
      records: [],
      
      // 添加记录
      addRecord: (record) => {
        const newRecord: HistoryRecord = {
          ...record,
          id: Date.now().toString(),
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        set((state) => ({
          records: [newRecord, ...state.records],
        }));
      },
      
      // 添加 JD 分析记录
      addJDAnalysisRecord: (jd, source, workspaceId, workspaceName) => {
        get().addRecord({
          type: 'jd_analysis',
          title: jd.summary.overview || 'JD 分析',
          content: jd,
          source,
          workspaceId,
          workspaceName,
        });
      },
      
      // 添加简历优化记录
      addResumeOptimizationRecord: (original, optimized, source, workspaceId, workspaceName) => {
        get().addRecord({
          type: 'resume_optimization',
          title: `${original.title} - 优化`,
          content: { original, optimized },
          source,
          workspaceId,
          workspaceName,
        });
      },
      
      // 添加面试记录
      addInterviewRecord: (interview, source, workspaceId, workspaceName) => {
        get().addRecord({
          type: 'interview',
          title: interview.title || 'AI 面试',
          content: interview,
          source,
          workspaceId,
          workspaceName,
        });
      },
      
      // 删除记录
      removeRecord: (id) => {
        set((state) => ({
          records: state.records.filter((r) => r.id !== id),
        }));
      },
      
      // 清空记录
      clearRecords: () => {
        set({ records: [] });
      },
      
      // 按类型查询
      getRecordsByType: (type) => {
        return get().records.filter((r) => r.type === type);
      },
      
      // 按来源查询
      getRecordsBySource: (source) => {
        return get().records.filter((r) => r.source === source);
      },
      
      // 按工作区查询
      getRecordsByWorkspace: (workspaceId) => {
        return get().records.filter((r) => r.workspaceId === workspaceId);
      },
    }),
    {
      name: 'interview-history',
      partialize: (state) => ({
        records: state.records,
      }),
    }
  )
);
