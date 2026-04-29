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
  const [loadError, setLoadError] = useState<string>('');
  const [isLoadingWorkspace, setIsLoadingWorkspace] = useState(false);

  // Options for setup modal
  const [jdOptions, setJdOptions] = useState<Array<{ value: string; label: string; jd: JDAnalysis; source: 'global' | 'workspace' }>>([]);
  const [resumeOptions, setResumeOptions] = useState<Array<{ value: string; label: string; resume: Resume; source: 'global' | 'workspace' }>>([]);
  const [kbOptions, setKbOptions] = useState<Array<{ value: string; label: string; kb: KnowledgeDocument }>>([]);

  // Check if this is a workspace interview
  useEffect(() => {
    if (currentInterviewId && currentInterviewWorkspaceId) {
      setIsLoadingWorkspace(true);
      setLoadError('');
      
      // 如果 InterviewStore 中已经有消息记录，说明 InterviewPanel 已经设置好了，直接使用
      // 或者如果正在继续面试（currentInterviewId存在），直接显示界面等待消息加载
      if (currentInterviewId) {
        console.log('[InterviewPage] 继续面试模式，直接显示界面:', {
          messageCount: messages.length,
          currentInterviewId,
          currentInterviewWorkspaceId
        });
        setIsLoadingWorkspace(false);
        setIsWorkspaceInterview(true);
        setIsStarted(true);
        return;
      }

      const workspace = workspaces.find(w => w.id === currentInterviewWorkspaceId);
      const interview = workspace?.interviews.find(i => i.id === currentInterviewId);
      
      console.log('[InterviewPage] 加载工作区面试:', { 
        currentInterviewId, 
        currentInterviewWorkspaceId, 
        workspaceFound: !!workspace, 
        interviewFound: !!interview,
        interviewStatus: interview?.status,
        workspacesCount: workspaces.length
      });
      
      if (workspace && interview) {
        setIsLoadingWorkspace(false);
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
        
        // If interview is ongoing or paused, start it
        if (interview.status === 'ongoing' || interview.status === 'paused') {
          setIsStarted(true);
          // 如果有已保存的消息，加载它们
          if (interview.messages && interview.messages.length > 0) {
            clearMessages();
            interview.messages.forEach((msg: any) => {
              addMessage(msg);
            });
            console.log('[InterviewPage] 已加载消息数量:', interview.messages.length);
          } else if (interview.status === 'ongoing') {
            // 否则生成第一个问题
            clearMessages();
            generateFirstQuestion(
              convertedJD, 
              convertedResume, 
              interview.interviewerConfig
            );
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
      } else {
        setIsLoadingWorkspace(false);
        setLoadError('未找到工作区或面试数据，请返回工作区重新选择');
        console.warn('[InterviewPage] 未找到工作区或面试:', { 
          currentInterviewId, 
          currentInterviewWorkspaceId,
          workspaces: workspaces.map(w => ({ id: w.id, name: w.name, interviewsCount: w.interviews?.length || 0 }))
        });
      }
    } else {
      setIsLoadingWorkspace(false);
    }
  }, [currentInterviewId, currentInterviewWorkspaceId, workspaces]); // eslint-disable-line react-hooks/exhaustive-deps
  // 注意：依赖 workspaces 是为了确保工作区数据加载后能重新执行
  // clearMessages, addMessage, generateFirstQuestion 是稳定的 store 方法
  // setJDAnalysis, setSelectedResume, setInterviewerConfig, setIsStarted, setIsWorkspaceInterview 也是稳定的
  // 但为了安全，只包含必要的依赖项，避免循环依赖导致的无限渲染问题。

  // 快速面试时重置 interviewStore
  useEffect(() => {
    if (!isWorkspaceInterview) {
      // 快速面试：重置状态，确保不继承工作区面试
      resetInterview();
      clearMessages();
      setIsStarted(false);
    }
  }, [isWorkspaceInterview]); // eslint-disable-line react-hooks/exhaustive-deps

  // 同步消息到 workspaceStore（工作区面试时）
  useEffect(() => {
    if (isWorkspaceInterview && currentInterviewWorkspaceId && currentInterviewId && messages.length > 0) {
      updateInterview(currentInterviewWorkspaceId, currentInterviewId, { messages });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [messages, isWorkspaceInterview, currentInterviewWorkspaceId, currentInterviewId]);

  // Load options from global database (both quick and workspace interviews use the same data)
  useEffect(() => {
    // 所有面试都使用全局数据库的数据（数据互用）
    const jdOpts = jdList.map((jd) => ({
      value: jd.id!,
      label: jd.summary?.overview?.slice(0, 50) || '未命名JD',
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
      // Update workspace interview status - save messages for continue
      const { updateInterview } = useWorkspaceStore.getState();
      updateInterview(currentInterviewWorkspaceId, currentInterviewId, {
        status: 'paused',
        messages: [...messages],
        turnCount: messages.filter(m => m.role === 'user').length,
        score: 0,
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
          ) : loadError ? (
            <Card style={{ borderRadius: 16 }}>
              <div style={{ textAlign: 'center', padding: '60px 24px' }}>
                <Title level={3} style={{ marginBottom: 16, color: '#ff4d4f' }}>
                  加载失败
                </Title>
                <Text type="secondary" style={{ fontSize: 16, display: 'block', marginBottom: 32 }}>
                  {loadError}
                </Text>
                <Button type="primary" onClick={handleBackToWorkspace}>
                  返回工作区
                </Button>
              </div>
            </Card>
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
