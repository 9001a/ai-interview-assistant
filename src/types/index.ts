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
  type: 'professional' | 'friendly' | 'strict' | 'casual' | 'custom';
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

// 简历类型
export interface Resume {
  id?: string;
  userId: string;
  title: string;
  fileUrl?: string;
  fileType: 'pdf' | 'docx' | 'text';
  content: string;
  summary: string;
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
  createdAt: string;
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

// API 响应类型
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}
