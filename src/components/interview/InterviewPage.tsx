'use client';

import { useState, useEffect } from 'react';
import { Card, Typography, Space, Button, message } from 'antd';
import { 
  MessageOutlined, 
  PlayCircleOutlined, 
  PauseCircleOutlined,
  ReloadOutlined 
} from '@ant-design/icons';
import { useInterviewStore } from '@/stores/interviewStore';
import { useHistoryStore } from '@/stores/historyStore';
import InterviewSetup from './InterviewSetup';
import InterviewChat from './InterviewChat';
import type { JDAnalysis, Resume, KnowledgeDocument, ChatMessage } from '@/types';
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

  // Local state
  const [setupModalOpen, setSetupModalOpen] = useState(false);
  const [lastQuestion, setLastQuestion] = useState<string>('');

  // Options for setup modal
  const [jdOptions, setJdOptions] = useState<Array<{ value: string; label: string; jd: JDAnalysis }>>([]);
  const [resumeOptions, setResumeOptions] = useState<Array<{ value: string; label: string; resume: Resume }>>([]);
  const [kbOptions, setKbOptions] = useState<Array<{ value: string; label: string; kb: KnowledgeDocument }>>([]);

  // Load options
  useEffect(() => {
    // Mock options - in real app, would load from stores
    const mockJd: JDAnalysis = {
      id: '1',
      userId: '1',
      originalText: '后端开发工程师...',
      summary: {
        overview: '需要后端开发工程师...',
        hiddenRequirements: '需要良好的沟通能力...',
        dailyWork: '负责后端服务开发...',
        prospects: '团队发展潜力大...',
      },
      tags: ['Java', 'Spring', '后端'],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const mockResume: Resume = {
      id: '1',
      userId: '1',
      title: 'Java工程师简历',
      content: '我是一名后端开发工程师...',
      summary: '有3年Java开发经验...',
      fileType: 'pdf',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    setJdOptions([{ value: '1', label: '后端开发工程师', jd: mockJd }]);
    setResumeOptions([{ value: '1', label: 'Java工程师简历', resume: mockResume }]);
    setKbOptions([{ value: '1', label: '后端面试题库', kb: { id: '1', userId: '1', title: '后端面试题库', sourceType: 'question_bank', createdAt: new Date().toISOString() } }]);
  }, []);

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
    setSetupModalOpen(false);
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
  };

  // Reset
  const handleReset = () => {
    resetInterview();
    setSetupModalOpen(true);
  };

  return (
    <div style={{ maxWidth: 1000, margin: '0 auto', padding: '24px 0' }}>
      {!isStarted ? (
        <Card style={{ borderRadius: 16 }}>
          <div style={{ textAlign: 'center', padding: '60px 24px' }}>
            <Title level={3} style={{ marginBottom: 16 }}>
              <MessageOutlined style={{ marginRight: 8, color: '#F5A623' }} />
              AI 模拟面试
            </Title>
            <Text type="secondary" style={{ fontSize: 16, display: 'block', marginBottom: 32 }}>
              选择 JD、简历和面试官，开始模拟面试
            </Text>
            <Space size="large">
              <Button 
                type="primary" 
                size="large" 
                icon={<PlayCircleOutlined />} 
                onClick={() => setSetupModalOpen(true)}
                style={{ height: 48, minWidth: 180, fontSize: 16 }}
              >
                开始面试
              </Button>
            </Space>
          </div>
        </Card>
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

      {/* Setup Modal */}
      <InterviewSetup
        open={setupModalOpen}
        onCancel={() => setSetupModalOpen(false)}
        onStart={handleStart}
        jdOptions={jdOptions}
        resumeOptions={resumeOptions}
        knowledgeBaseOptions={kbOptions}
      />
    </div>
  );
}
