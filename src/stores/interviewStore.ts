import { create } from 'zustand';
import { InterviewSession, ChatMessage, InterviewerConfig, InterviewerPreset, JDAnalysis, Resume, KnowledgeDocument } from '@/types';

interface InterviewState {
  currentSession: InterviewSession | null;
  messages: ChatMessage[];
  jdAnalysis: JDAnalysis | null;
  selectedResume: Resume | null;
  selectedKnowledgeBase: KnowledgeDocument | null;
  interviewerConfig: InterviewerConfig;
  isStarted: boolean;
  isLoading: boolean;
  turnCount: number;
  // Resume related
  resumeContent: string;
  resumeFilename: string;
  optimizedResume: string;
  // Presets
  presets: InterviewerPreset[];
  activePresetId: string | null;
  // Actions
  setCurrentSession: (session: InterviewSession | null) => void;
  addMessage: (message: ChatMessage) => void;
  setMessages: (messages: ChatMessage[]) => void;
  clearMessages: () => void;
  setJDAnalysis: (jd: JDAnalysis | null) => void;
  setSelectedResume: (resume: Resume | null) => void;
  setSelectedKnowledgeBase: (kb: KnowledgeDocument | null) => void;
  setInterviewerConfig: (config: Partial<InterviewerConfig>) => void;
  setIsStarted: (started: boolean) => void;
  setIsLoading: (loading: boolean) => void;
  incrementTurnCount: () => void;
  // Resume actions
  setResumeContent: (content: string) => void;
  setResumeFilename: (filename: string) => void;
  setOptimizedResume: (content: string) => void;
  resetInterview: () => void;
  // Preset actions
  addPreset: (preset: Omit<InterviewerPreset, 'id' | 'createdAt' | 'updatedAt'>) => string;
  updatePreset: (id: string, preset: Partial<InterviewerPreset>) => void;
  deletePreset: (id: string) => void;
  loadPreset: (id: string) => void;
  setActivePresetId: (id: string | null) => void;
}

const defaultInterviewerConfig: InterviewerConfig = {
  name: '友好型面试官',
  type: 'friendly',
  style: '温和引导',
  tone: '温和',
  expression: '鼓励式',
  questionStyle: '逐步深入',
  features: {
    correctErrors: true,
    giveAnswers: false,
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

// 系统预设模板
const builtInPresets: InterviewerPreset[] = [
  {
    id: 'builtin-professional',
    name: '专业型',
    description: '注重技术深度和逻辑严谨性，适合大厂技术面试',
    isBuiltIn: true,
    createdAt: Date.now(),
    updatedAt: Date.now(),
    config: {
      name: '专业型面试官',
      type: 'professional',
      style: '严格专业',
      tone: '严谨',
      expression: '直接',
      questionStyle: '深入挖掘',
      features: {
        correctErrors: true,
        giveAnswers: false,
        askFollowUps: true,
        giveFeedback: true,
        doScoring: true,
      },
      focusAreas: {
        technical: true,
        project: true,
        softSkills: false,
        career: true,
      },
      systemPrompt: '你是一位经验丰富的大厂技术面试官，面试风格严谨专业。\n\n面试风格：\n- 注重技术深度，会追问实现细节\n- 要求逻辑严密，关注系统设计能力\n- 语气专业直接，不拖泥带水\n\n提问策略：\n- 使用"为什么这么设计？"来深入考察\n- 关注技术选型的合理性\n- 追问性能优化和边界情况\n\n纠错方式：\n- 直接指出问题所在\n- 要求重新思考并给出正确答案\n- 解释为什么原答案有问题\n\n面试材料：\n- JD: {{jd_summary}}\n- 简历: {{resume_summary}}\n{{knowledge_context}}\n\n现在开始面试吧！先让候选人自我介绍。',
    },
  },
  {
    id: 'builtin-friendly',
    name: '友好型',
    description: '温和引导，关注思维过程，适合初次面试或新人',
    isBuiltIn: true,
    createdAt: Date.now(),
    updatedAt: Date.now(),
    config: {
      name: '友好型面试官',
      type: 'friendly',
      style: '温和引导',
      tone: '温和',
      expression: '鼓励式',
      questionStyle: '逐步深入',
      features: {
        correctErrors: true,
        giveAnswers: false,
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
      systemPrompt: '你是一位温和友善的面试官，像一个耐心的导师。\n\n面试风格：\n- 对候选人比较耐心，会引导思考\n- 在关键问题上要求逻辑严密\n- 语气温和但专业\n\n提问策略：\n- 使用"你为什么这么想？"来引导，而不是直接否定\n- 关注候选人的思维过程，而不仅仅是答案\n\n纠错方式：\n- 温和地指出错误："这个思路有些问题，我们可以这样思考..."\n- 给出正确答案和解释\n\n面试材料：\n- JD: {{jd_summary}}\n- 简历: {{resume_summary}}\n{{knowledge_context}}\n\n现在开始面试吧！先让候选人自我介绍。',
    },
  },
  {
    id: 'builtin-stress',
    name: '压力型',
    description: '快节奏追问，考察抗压能力和应变能力',
    isBuiltIn: true,
    createdAt: Date.now(),
    updatedAt: Date.now(),
    config: {
      name: '压力型面试官',
      type: 'stress',
      style: '快节奏追问',
      tone: '严肃',
      expression: '挑战性',
      questionStyle: '连续追问',
      features: {
        correctErrors: true,
        giveAnswers: false,
        askFollowUps: true,
        giveFeedback: false,
        doScoring: true,
      },
      focusAreas: {
        technical: true,
        project: true,
        softSkills: true,
        career: false,
      },
      systemPrompt: '你是一位压力型面试官，通过快节奏的追问来考察候选人的抗压能力。\n\n面试风格：\n- 语速快，问题密集\n- 对模糊回答会立即追问细节\n- 态度严肃，不苟言笑\n\n提问策略：\n- 不给你太多思考时间\n- 一个问题接一个问题\n- 故意打断，考验应变能力\n\n纠错方式：\n- 直接指出："不对，这个答案有问题"\n- 不给解释，继续下一个问题\n\n面试材料：\n- JD: {{jd_summary}}\n- 简历: {{resume_summary}}\n{{knowledge_context}}\n\n现在开始面试吧！简单自我介绍，1分钟。',
    },
  },
];

// 从 localStorage 加载保存的配置
const loadSavedConfig = (): InterviewerConfig => {
  if (typeof window === 'undefined') return defaultInterviewerConfig;
  try {
    const saved = localStorage.getItem('interviewer_config');
    if (saved) {
      const parsed = JSON.parse(saved);
      return { ...defaultInterviewerConfig, ...parsed };
    }
  } catch (e) {
    console.error('Failed to load interviewer config:', e);
  }
  return defaultInterviewerConfig;
};

// 从 localStorage 加载保存的 presets
const loadSavedPresets = (): InterviewerPreset[] => {
  if (typeof window === 'undefined') return [];
  try {
    const saved = localStorage.getItem('interviewer_presets');
    if (saved) {
      return JSON.parse(saved);
    }
  } catch (e) {
    console.error('Failed to load interviewer presets:', e);
  }
  return [];
};

// 从 localStorage 加载当前使用的 preset ID
const loadActivePresetId = (): string | null => {
  if (typeof window === 'undefined') return null;
  try {
    return localStorage.getItem('interviewer_active_preset_id');
  } catch (e) {
    console.error('Failed to load active preset id:', e);
  }
  return null;
};

export const useInterviewStore = create<InterviewState>((set, get) => ({
  currentSession: null,
  messages: [],
  jdAnalysis: null,
  selectedResume: null,
  selectedKnowledgeBase: null,
  interviewerConfig: loadSavedConfig(),
  isStarted: false,
  isLoading: false,
  turnCount: 0,
  resumeContent: '',
  resumeFilename: '',
  optimizedResume: '',
  presets: [...builtInPresets, ...loadSavedPresets()],
  activePresetId: loadActivePresetId(),
  setCurrentSession: (session) => set({ currentSession: session }),
  addMessage: (message) =>
    set((state) => ({ messages: [...state.messages, message] })),
  setMessages: (messages) => set({ messages }),
  clearMessages: () => set({ messages: [] }),
  setJDAnalysis: (jd) => set({ jdAnalysis: jd }),
  setSelectedResume: (resume) => set({ selectedResume: resume }),
  setSelectedKnowledgeBase: (kb) => set({ selectedKnowledgeBase: kb }),
  setInterviewerConfig: (config) =>
    set((state) => ({
      interviewerConfig: { ...state.interviewerConfig, ...config },
    })),
  setIsStarted: (started) => set({ isStarted: started }),
  setIsLoading: (loading) => set({ isLoading: loading }),
  incrementTurnCount: () => set((state) => ({ turnCount: state.turnCount + 1 })),
  setResumeContent: (content) => set({ resumeContent: content }),
  setResumeFilename: (filename) => set({ resumeFilename: filename }),
  setOptimizedResume: (content) => set({ optimizedResume: content }),
  resetInterview: () =>
    set({
      currentSession: null,
      messages: [],
      jdAnalysis: null,
      selectedResume: null,
      selectedKnowledgeBase: null,
      interviewerConfig: defaultInterviewerConfig,
      isStarted: false,
      isLoading: false,
      turnCount: 0,
      resumeContent: '',
      resumeFilename: '',
      optimizedResume: '',
    }),
  // Preset actions
  addPreset: (preset) => {
    const id = `preset-${Date.now()}`;
    const newPreset: InterviewerPreset = {
      ...preset,
      id,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    set((state) => {
      const userPresets = state.presets.filter((p) => !p.isBuiltIn);
      const newUserPresets = [...userPresets, newPreset];
      if (typeof window !== 'undefined') {
        localStorage.setItem('interviewer_presets', JSON.stringify(newUserPresets));
      }
      return { presets: [...builtInPresets, ...newUserPresets] };
    });
    return id;
  },
  updatePreset: (id, updates) => {
    set((state) => {
      const newPresets = state.presets.map((p) =>
        p.id === id ? { ...p, ...updates, updatedAt: Date.now() } : p
      );
      const userPresets = newPresets.filter((p) => !p.isBuiltIn);
      if (typeof window !== 'undefined') {
        localStorage.setItem('interviewer_presets', JSON.stringify(userPresets));
      }
      return { presets: newPresets };
    });
  },
  deletePreset: (id) => {
    set((state) => {
      const newPresets = state.presets.filter((p) => p.id !== id);
      const userPresets = newPresets.filter((p) => !p.isBuiltIn);
      if (typeof window !== 'undefined') {
        localStorage.setItem('interviewer_presets', JSON.stringify(userPresets));
      }
      if (state.activePresetId === id) {
        localStorage.removeItem('interviewer_active_preset_id');
        return { presets: newPresets, activePresetId: null };
      }
      return { presets: newPresets };
    });
  },
  loadPreset: (id) => {
    const preset = get().presets.find((p) => p.id === id);
    if (preset) {
      set({
        interviewerConfig: preset.config,
        activePresetId: id,
      });
      if (typeof window !== 'undefined') {
        localStorage.setItem('interviewer_active_preset_id', id);
        localStorage.setItem('interviewer_config', JSON.stringify(preset.config));
      }
    }
  },
  setActivePresetId: (id) => {
    set({ activePresetId: id });
    if (typeof window !== 'undefined') {
      if (id) {
        localStorage.setItem('interviewer_active_preset_id', id);
      } else {
        localStorage.removeItem('interviewer_active_preset_id');
      }
    }
  },
}));
