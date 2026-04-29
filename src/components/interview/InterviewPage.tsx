'use client';

import { useState, useEffect, useRef } from 'react';
import { Card, Typography, Space, Button, message } from 'antd';
import { 
  MessageOutlined, 
  PlayCircleOutlined, 
  PauseCircleOutlined,
  ReloadOutlined,
  ArrowLeftOutlined,
} from '@ant-design/icons';
import { useInterviewStore } from '@/stores/interviewStore';
import { useHistoryStore } from '@/stores/historyStore';
import { usePageStore } from '@/stores/pageStore';
import { useWorkspaceStore } from '@/stores/workspaceStore';
import { useJDStore } from '@/stores/jdStore';
import { useResumeStore } from '@/stores/resumeStore';
import InterviewSetup from './InterviewSetup';
import InterviewChat from './InterviewChat';
import type { JDAnalysis, Resume, KnowledgeDocument, ChatMessage, WorkspaceJD, WorkspaceResume } from '@/types';
import { interviewApi } from '@/services/api';

const { Title, Text } = Typography;

export default function InterviewPage() {
  // Store state
  const {
    isStarted,
    isLoading,
    turnCount,
    messages,
    interviewerConfig,
    jdAnalysis,
    selectedResume,
    selectedKnowledgeBase,
    setIsStarted,
    setIsLoading,
    setJDAnalysis,
    setSelectedResume,
    setSelectedKnowledgeBase,
    setInterviewerConfig,
    addMessage,
    clearMessages,
    incrementTurnCount,
    resetInterview,
  } = useInterviewStore();

  const { 
    currentInterviewId, 
    currentInterviewWorkspaceId,
    setCurrentInterview,
    setCurrentPage 
  } = usePageStore();
  
  const { currentWorkspace, workspaces, updateInterview } = useWorkspaceStore();
  const { jdList } = useJDStore();
  const { resumes } = useResumeStore();

  // Local state
  const [lastQuestion, setLastQuestion] = useState<string>('');
  const [isWorkspaceInterview, setIsWorkspaceInterview] = useState(false);

  // Options for setup modal
  const [jdOptions, setJdOptions] = useState<Array<{ value: string; label: string; jd: JDAnalysis; source: 'global' | 'workspace' }>>([]);
  const [resumeOptions, setResumeOptions] = useState<Array<{ value: string; label: string; resume: Resume; source: 'global' | 'workspace' }>>([]);
  const [kbOptions, setKbOptions] = useState<Array<{ value: string; label: string; kb: KnowledgeDocument }>>([]);

  // Check if this is a workspace interview
  // 注意：使用 ref 获取最新的 workspaces，避免依赖 workspaces 导致循环
  const workspacesRef = useRef(workspaces);
  workspacesRef.current = workspaces;
  
  useEffect(() => {
    if (currentInterviewId && currentInterviewWorkspaceId) {
      const workspace = workspacesRef.current.find(w => w.id === currentInterviewWorkspaceId);
      const interview = workspace?.interviews.find(i => i.id === currentInterviewId);
      
      if (workspace && interview) {
        setIsWorkspaceInterview(true);
        
        // Convert workspace JD/resume to JDAnalysis/Resume format
        const jd = workspace.jdList.find(j => j.id === interview.jdId);
        const resume = workspace.resumes.find(r => r.id === interview.resumeId);
        
        // 保存转换后的数据供后续使用
        let convertedJD: JDAnalysis | null = null;
        let convertedResume: Resume | null = null;
        
        if (jd) {
          convertedJD = {
            id: jd.id,
            userId: workspace.userId,
            originalText: jd.originalText,
            summary: {
              overview: jd.title,
              hiddenRequirements: '',
              dailyWork: '',
              prospects: '',
            },
            tags: jd.tags,
            createdAt: jd.createdAt,
            updatedAt: jd.createdAt,
          };
          setJDAnalysis(convertedJD);
        }
        
        if (resume) {
          convertedResume = {
            id: resume.id,
            userId: workspace.userId,
            title: resume.title,
            content: resume.content,
            summary: '',
            fileType: resume.fileType,
            createdAt: resume.createdAt,
            updatedAt: resume.createdAt,
          };
          setSelectedResume(convertedResume);
        }
        
        setInterviewerConfig(interview.interviewerConfig);
        
        // If interview is ongoing, start it
        if (interview.status === 'ongoing') {
          setIsStarted(true);
          // 如果有已保存的消息，加载它们
          if (interview.messages && interview.messages.length > 0) {
            clearMessages();
            interview.messages.forEach((msg: any) => {
              addMessage(msg);
            });
          } else {
            // 否则生成第一个问题
            clearMessages();
            generateFirstQuestion(
              convertedJD, 
              convertedResume, 
              interview.interviewerConfig
            );
          }
        } else if (interview.status === 'paused') {
          // 如果是暂停状态，加载已有消息
          setIsStarted(true);
          if (interview.messages && interview.messages.length > 0) {
            clearMessages();
            interview.messages.forEach((msg: any) => {
              addMessage(msg);
            });
          }
        } else if (interview.status === 'completed') {
          // 如果是已完成状态，只加载消息（不开始新面试）
          if (interview.messages && interview.messages.length > 0) {
            clearMessages();
            interview.messages.forEach((msg: any) => {
              addMessage(msg);
            });
          }
        } else {
          // 未开始状态，显示配置界面
          setIsStarted(false);
        }
      }
    }
  }, [currentInterviewId, currentInterviewWorkspaceId]);

  // 同步消息到 workspaceStore（工作区面试时）
  useEffect(() => {
    if (isWorkspaceInterview && currentInterviewWorkspaceId && currentInterviewId && messages.length > 0) {
      updateInterview(currentInterviewWorkspaceId, currentInterviewId, { messages });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [messages, isWorkspaceInterview, currentInterviewWorkspaceId, currentInterviewId]);

  // Load options based on interview type
  useEffect(() => {
    if (isWorkspaceInterview && currentWorkspace) {
      // 工作区面试：只使用工作区内的数据
      const jdOpts = currentWorkspace.jdList.map((jd) => ({
        value: jd.id,
        label: jd.title || '未命名JD',
        jd: {
          id: jd.id,
          userId: 'workspace',
          title: jd.title,
          originalText: jd.originalText,
          summary: jd.summary,
          tags: jd.tags,
          createdAt: jd.createdAt,
          updatedAt: jd.createdAt,
        } as unknown as JDAnalysis,
        source: 'workspace' as const,
      }));
      setJdOptions(jdOpts);

      const resumeOpts = currentWorkspace.resumes.map((resume) => ({
        value: resume.id,
        label: resume.title,
        resume: {
          id: resume.id,
          userId: 'workspace',
          title: resume.title,
          originalText: resume.content,
          createdAt: resume.createdAt,
          updatedAt: resume.createdAt,
        } as unknown as Resume,
        source: 'workspace' as const,
      }));
      setResumeOptions(resumeOpts);
    } else {
      // 快速面试：使用全局数据库的数据
      const jdOpts = jdList.map((jd) => ({
        value: jd.id!,
        label: jd.summary.overview.slice(0, 50) || '未命名JD',
        jd,
        source: 'global' as const,
      }));
      setJdOptions(jdOpts);

      const resumeOpts = resumes.map((resume) => ({
        value: resume.id!,
        label: resume.title,
        resume,
        source: 'global' as const,
      }));
      setResumeOptions(resumeOpts);
    }

    // Mock KB options for now
    setKbOptions([{ value: '1', label: '后端面试题库', kb: { id: '1', userId: '1', title: '后端面试题库', sourceType: 'question_bank', createdAt: new Date().toISOString() } }]);
  }, [jdList, resumes, isWorkspaceInterview, currentWorkspace]);

  // Start interview
  const handleStart = async (config: {
    jd: JDAnalysis | null;
    resume: Resume | null;
    knowledgeBase: KnowledgeDocument | null;
    interviewerConfig: any;
  }) => {
    setJDAnalysis(config.jd);
    setSelectedResume(config.resume);
    setSelectedKnowledgeBase(config.knowledgeBase);
    setInterviewerConfig(config.interviewerConfig);
    clearMessages();
    setIsStarted(true);
    
    // Generate first question
    await generateFirstQuestion(config.jd, config.resume, config.interviewerConfig);
  };

  // Generate first question
  const generateFirstQuestion = async (
    jd: JDAnalysis | null, 
    resume: Resume | null, 
    config: any
  ) => {
    setIsLoading(true);

    const typingMsg: ChatMessage = {
      id: Date.now().toString(),
      sessionId: 'temp',
      role: 'assistant',
      content: '',
      isTyping: true,
      createdAt: new Date().toISOString(),
    };
    addMessage(typingMsg);

    try {
      const res = await interviewApi.chat({
        mode: 'question',
        jdAnalysis: jd,
        resume,
        interviewerConfig: config,
        messages: [],
      });

      if (res.success && res.question) {
        setLastQuestion(res.question);
        
        const questionMsg: ChatMessage = {
          id: Date.now().toString(),
          sessionId: 'temp',
          role: 'assistant',
          content: res.question,
          turn: 0,
          createdAt: new Date().toISOString(),
        };
        
        // Replace typing message
        const newMessages = [...useInterviewStore.getState().messages];
        newMessages[newMessages.length - 1] = questionMsg;
        clearMessages();
        newMessages.forEach(m => addMessage(m));
      }
    } catch (error) {
      message.error('生成问题失败，请重试');
      setIsStarted(false);
    } finally {
      setIsLoading(false);
    }
  };

  // Send message
  const handleSendMessage = async (content: string) => {
    // Add user message
    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      sessionId: 'temp',
      role: 'user',
      content,
      turn: turnCount,
      createdAt: new Date().toISOString(),
    };
    addMessage(userMsg);

    setIsLoading(true);
    incrementTurnCount();
    
    // If it's a workspace interview, update turn count in workspace
    if (isWorkspaceInterview && currentInterviewId && currentInterviewWorkspaceId) {
      const { updateInterview } = useWorkspaceStore.getState();
      updateInterview(currentInterviewWorkspaceId, currentInterviewId, {
        turnCount: turnCount + 1,
      });
    }

    // Add typing message
    const typingMsg: ChatMessage = {
      id: (Date.now() + 1).toString(),
      sessionId: 'temp',
      role: 'assistant',
      content: '',
      isTyping: true,
      createdAt: new Date().toISOString(),
    };
    addMessage(typingMsg);

    try {
      const res = await interviewApi.chat({
        mode: 'evaluate',
        jdAnalysis,
        resume: selectedResume,
        interviewerConfig,
        userAnswer: content,
        lastQuestion,
      });

      if (res.success && res.evaluation) {
        const { feedback, nextQuestion, shouldContinue, score } = res.evaluation;
        
        setLastQuestion(nextQuestion);
        
        const assistantMsg: ChatMessage = {
          id: (Date.now() + 2).toString(),
          sessionId: 'temp',
          role: 'assistant',
          content: feedback + '\n\n' + nextQuestion,
          turn: turnCount,
          createdAt: new Date().toISOString(),
        };
        
        // Replace typing message
        const newMessages = [...useInterviewStore.getState().messages];
        newMessages[newMessages.length - 1] = assistantMsg;
        clearMessages();
        newMessages.forEach(m => addMessage(m));

        if (!shouldContinue || turnCount >= 29) {
          message.info('面试已结束');
        }
      }
    } catch (error) {
      message.error('对话失败，请重试');
    } finally {
      setIsLoading(false);
    }
  };

  // End interview
  const handleEndInterview = () => {
    setIsStarted(false);
    
    if (isWorkspaceInterview && currentInterviewId && currentInterviewWorkspaceId) {
      // Update workspace interview status
      const { updateInterview } = useWorkspaceStore.getState();
      updateInterview(currentInterviewWorkspaceId, currentInterviewId, {
        status: 'completed',
        score: 0, // Can calculate from messages
      });
      
      // Save to history
      useHistoryStore.getState().addRecord({
        type: 'interview',
        title: jdAnalysis ? (jdAnalysis.summary.overview || '工作区面试') : '工作区面试',
        content: {
          jdAnalysis,
          resume: selectedResume,
          messages: [...messages],
          interviewerConfig,
          knowledgeBaseId: selectedKnowledgeBase?.id,
          turnCount,
          score: 0,
        },
        source: 'workspace',
        workspaceId: currentInterviewWorkspaceId,
        interviewId: currentInterviewId,
      });
      
      message.success('面试已结束，已保存到历史记录和工作区');
    } else {
      // 保存到历史记录 - 只保存 content，不需要完整的 WorkspaceInterview
      useHistoryStore.getState().addRecord({
        type: 'interview',
        title: jdAnalysis ? (jdAnalysis.summary.overview || 'AI 面试') : 'AI 面试',
        content: {
          jdAnalysis,
          resume: selectedResume,
          messages: [...messages],
          interviewerConfig,
          knowledgeBaseId: selectedKnowledgeBase?.id,
          turnCount,
          score: 0, // 后续可以从最后一次评分提取
        },
        source: 'quick',
      });
      
      message.success('面试已结束，已保存到历史记录');
    }
  };

  // Go back to workspace
  const handleBackToWorkspace = () => {
    setCurrentInterview(null, null);
    setCurrentPage('workspace');
  };

  // Reset
  const handleReset = () => {
    resetInterview();
  };

  return (
    <div style={{ maxWidth: 1000, margin: '0 auto', padding: '24px 0' }}>
      {/* Header with back button for workspace interview */}
      {isWorkspaceInterview && (
        <div style={{ marginBottom: 16, display: 'flex', alignItems: 'center' }}>
          <Button 
            icon={<ArrowLeftOutlined />} 
            onClick={handleBackToWorkspace}
            style={{ marginRight: 16 }}
          >
            返回工作区
          </Button>
          <Title level={4} style={{ margin: 0 }}>
            工作区面试
          </Title>
        </div>
      )}
      
      {!isStarted ? (
        <>
          {!isWorkspaceInterview ? (
            <InterviewSetup
              onStart={handleStart}
              jdOptions={jdOptions}
              resumeOptions={resumeOptions}
              knowledgeBaseOptions={kbOptions}
            />
          ) : (
            <Card style={{ borderRadius: 16 }}>
              <div style={{ textAlign: 'center', padding: '60px 24px' }}>
                <Title level={3} style={{ marginBottom: 16 }}>
                  <MessageOutlined style={{ marginRight: 8, color: '#F5A623' }} />
                  工作区面试
                </Title>
                <Text type="secondary" style={{ fontSize: 16, display: 'block', marginBottom: 32 }}>
                  正在加载面试...
                </Text>
              </div>
            </Card>
          )}
        </>
      ) : (
        <InterviewChat
          messages={messages}
          isLoading={isLoading}
          onSendMessage={handleSendMessage}
          onEndInterview={handleEndInterview}
          interviewerConfig={interviewerConfig}
          turnCount={turnCount}
        />
      )}
    </div>
  );
}
