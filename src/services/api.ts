import axios from 'axios';
import { JDAnalysis } from '@/types';

// 创建 axios 实例
const api = axios.create({
  baseURL: '/api',
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// 请求拦截器 - 添加 token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('access_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// 响应拦截器
api.interceptors.response.use(
  (response) => response.data,
  (error) => {
    if (error.response?.status === 401) {
      // 清除 token 并跳转到登录页
      localStorage.removeItem('access_token');
      localStorage.removeItem('user');
      window.location.href = '/';
    }
    return Promise.reject(error);
  }
);

// 认证 API
export const authApi = {
  // 发送验证码
  sendCode: async (email: string) => {
    return api.post('/auth/send-code', { email });
  },

  // 验证验证码并登录
  verifyCode: async (email: string, code: string) => {
    return api.post('/auth/verify', { email, code });
  },

  // 获取当前用户
  getMe: async () => {
    return api.get('/auth/me');
  },
};

// JD 分析 API
export const jdApi = {
  // 分析 JD
  analyze: async (text: string): Promise<{ success: boolean; data: { summary: any; tags: string[] } }> => {
    const res = await api.post('/jd/analyze', { jdText: text });
    return res.data;
  },

  // 保存 JD
  save: async (data: any) => {
    return api.post('/jd/save', data);
  },

  // 获取 JD 列表
  list: async () => {
    return api.get('/jd/list');
  },
};

// 简历 API
export const resumeApi = {
  // 上传简历文件
  upload: async (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    return api.post('/resume/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },

  // 解析简历
  parse: async (text: string) => {
    return api.post('/resume/parse', { text });
  },

  // 优化简历
  optimize: async (data: { resumeContent: string; jdTexts: string[] }): Promise<{ success: boolean; data: { content: string; highlights: string[]; score: number } }> => {
    const res = await api.post('/resume/optimize', data);
    return res.data;
  },
};

// 面试 API
export const interviewApi = {
  // 开始面试
  start: async (data: any) => {
    return api.post('/interview/start', data);
  },

  // 发送消息
  sendMessage: async (sessionId: string, message: string) => {
    return api.post('/interview/chat', { sessionId, message });
  },

  // 结束面试
  end: async (sessionId: string) => {
    return api.post('/interview/end', { sessionId });
  },

  // 获取面试列表
  list: async () => {
    return api.get('/interview/list');
  },

  // 获取面试详情
  getDetail: async (sessionId: string) => {
    return api.get(`/interview/${sessionId}`);
  },
};

// 知识库 API
export const knowledgeApi = {
  // 上传文档
  upload: async (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    return api.post('/knowledge/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },

  // 获取文档列表
  list: async () => {
    return api.get('/knowledge/list');
  },

  // 删除文档
  delete: async (id: string) => {
    return api.delete(`/knowledge/${id}`);
  },
};

export default api;
