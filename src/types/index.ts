// 用户类型
export interface User {
  id: string;
  email: string;
  name: string;
  createdAt: string;
}

// 面试官配置类型
export interface InterviewerConfig {
  id?: string;
  name: string;
  type: 'professional' | 'friendly' | 'stress' | 'strict' | 'casual' | 'custom';
  style: string;
  tone: string;
  expression: string;
  questionStyle: string;
  features: {
    correctErrors: boolean;
    giveAnswers: boolean;
    askFollowUps: boolean;
    giveFeedback: boolean;
    doScoring: boolean;
  };
  focusAreas: {
    technical: boolean;
    project: boolean;
    softSkills: boolean;
    career: boolean;
  };
  customDescription?: string;
  systemPrompt?: string;
}

// JD 分析结果类型
export interface JDAnalysis {
  id?: string;
  userId: string;
  title?: string;
  originalText: string;
  summary: {
    overview: string;
    hiddenRequirements: string;
    dailyWork: string;
    prospects: string;
  };
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

// 简历优化记录
export interface ResumeOptimization {
  id: string;
  content: string;
  highlights: string[];
  score: number;
  jdTitle?: string;
  createdAt: string;
}

// 简历类型
export interface Resume {
  id?: string;
  userId: string;
  title: string;
  fileUrl?: string;
  fileType: 'pdf' | 'docx' | 'text';
  content: string;
  summary: string;
  optimizations?: ResumeOptimization[];
  createdAt: string;
  updatedAt: string;
}

// 面试会话类型
export interface InterviewSession {
  id: string;
  userId: string;
  title: string;
  jdId?: string;
  resumeId?: string;
  jdSummary?: string;
  resumeSummary?: string;
  interviewerConfig: InterviewerConfig;
  status: 'ongoing' | 'paused' | 'completed';
  score?: number;
  report?: InterviewReport;
  turnCount: number;
  createdAt: string;
  updatedAt: string;
}

// 对话消息类型
export interface ChatMessage {
  id: string;
  sessionId: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  turn?: number;
  isTyping?: boolean;
  createdAt: string;
  timestamp?: string;
}

// 面试报告类型
export interface InterviewReport {
  overallScore: number;
  dimensionScores: {
    technical: number;
    project: number;
    communication: number;
    logical: number;
  };
  strengths: string[];
  weaknesses: string[];
  suggestions: string[];
}

// 知识库文档类型
export interface KnowledgeDocument {
  id?: string;
  userId: string;
  title: string;
  sourceType: 'interview_notes' | 'question_bank' | 'company_info';
  originalFilename?: string;
  fileUrl?: string;
  content?: string; // 文档内容
  embedding?: number[]; // 向量嵌入
  embeddingUpdatedAt?: string; // 向量更新时间
  createdAt: string;
}

// 检索结果类型
export interface RetrievalResult {
  id: string;
  content: string;
  questionType?: string;
  context: {
    section: string;
    chapter: string;
    source: string;
  };
  similarity?: number;
  rerankScore?: number;
}

// 工作区简历记录
export interface WorkspaceResume {
  id: string;
  title: string;
  content: string;
  summary: string;
  fileUrl?: string;
  fileType: 'pdf' | 'docx' | 'text';
  createdAt: string;
}

// 工作区 JD 记录
export interface WorkspaceJD {
  id: string;
  title: string;
  originalText: string;
  summary: {
    overview: string;
    hiddenRequirements: string;
    dailyWork: string;
    prospects: string;
  };
  tags: string[];
  createdAt: string;
}

// 工作区优化记录
export interface WorkspaceOptimization {
  id: string;
  resumeId: string;
  jdIds: string[];
  optimizedContent: string;
  highlights: string[];
  score: number;
  createdAt: string;
}

// 工作区面试记录
export interface WorkspaceInterview {
  id: string;
  title: string;
  jdId?: string;
  resumeId?: string;
  knowledgeBaseId?: string;
  interviewerConfig: InterviewerConfig;
  status: 'ongoing' | 'completed' | 'paused';
  score?: number;
  turnCount: number;
  messages?: any[];
  createdAt: string;
  updatedAt: string;
}

// 工作区类型
export type WorkspaceType = 'backend' | 'frontend' | 'algorithm' | 'product' | 'custom';

export interface Workspace {
  id: string;
  userId: string;
  name: string;
  type: WorkspaceType;
  customDescription?: string;
  jdList: WorkspaceJD[];
  resumes: WorkspaceResume[];
  optimizations: WorkspaceOptimization[];
  interviews: WorkspaceInterview[];
  status: 'analyzing' | 'optimizing' | 'interviewing' | 'completed' | 'idle';
  createdAt: string;
  updatedAt: string;
}

// API 响应类型
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

// 历史记录类型
export type HistoryRecordType = 'jd_analysis' | 'resume_optimization' | 'interview';

export interface HistoryRecord {
  id: string;
  type: HistoryRecordType;
  title: string;
  content: any;
  source: 'workspace' | 'quick';
  workspaceId?: string;
  interviewId?: string;
  workspaceName?: string;
  createdAt: string;
  updatedAt: string;
  // 面试特有字段
  status?: 'ongoing' | 'paused' | 'completed';
  turns?: number;
  score?: number;
  // 面试消息记录
  messages?: any[];
}
