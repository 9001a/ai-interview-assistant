import { create } from 'zustand';
import { InterviewSession, ChatMessage, InterviewerConfig, JDAnalysis, Resume } from '@/types';

interface InterviewState {
  currentSession: InterviewSession | null;
  messages: ChatMessage[];
  jdAnalysis: JDAnalysis | null;
  selectedResume: Resume | null;
  interviewerConfig: InterviewerConfig;
  setCurrentSession: (session: InterviewSession | null) => void;
  addMessage: (message: ChatMessage) => void;
  clearMessages: () => void;
  setJDAnalysis: (jd: JDAnalysis | null) => void;
  setSelectedResume: (resume: Resume | null) => void;
  setInterviewerConfig: (config: Partial<InterviewerConfig>) => void;
  resetInterview: () => void;
}

const defaultInterviewerConfig: InterviewerConfig = {
  name: '专业型面试官',
  type: 'professional',
  style: '专业严谨',
  tone: '正式',
  expression: '专业且简洁',
  questionStyle: '直接提问',
  features: {
    correctErrors: true,
    giveAnswers: true,
    askFollowUps: true,
    giveFeedback: true,
    doScoring: false,
  },
  focusAreas: {
    technical: true,
    project: true,
    softSkills: true,
    career: false,
  },
};

export const useInterviewStore = create<InterviewState>((set) => ({
  currentSession: null,
  messages: [],
  jdAnalysis: null,
  selectedResume: null,
  interviewerConfig: defaultInterviewerConfig,
  setCurrentSession: (session) => set({ currentSession: session }),
  addMessage: (message) =>
    set((state) => ({ messages: [...state.messages, message] })),
  clearMessages: () => set({ messages: [] }),
  setJDAnalysis: (jd) => set({ jdAnalysis: jd }),
  setSelectedResume: (resume) => set({ selectedResume: resume }),
  setInterviewerConfig: (config) =>
    set((state) => ({
      interviewerConfig: { ...state.interviewerConfig, ...config },
    })),
  resetInterview: () =>
    set({
      currentSession: null,
      messages: [],
      jdAnalysis: null,
      selectedResume: null,
      interviewerConfig: defaultInterviewerConfig,
    }),
}));
