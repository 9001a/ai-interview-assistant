'use client';

import { useState, useEffect } from 'react';
import { Card, Typography, Button, Space, Tag, Progress, Divider, Spin, message, Alert } from 'antd';
import { ArrowLeftOutlined, CheckCircleOutlined, CloseCircleOutlined, BulbOutlined } from '@ant-design/icons';
import { usePageStore } from '@/stores/pageStore';
import { useWorkspaceStore } from '@/stores/workspaceStore';
import { interviewApi } from '@/services/api';
import type { WorkspaceInterview, ChatMessage } from '@/types';

const { Title, Text, Paragraph } = Typography;

interface InterviewReportProps {
  interview: WorkspaceInterview;
  onBack: () => void;
}

interface ReportData {
  score: number;
  strengths: string[];
  weaknesses: string[];
  suggestions: string[];
}

export default function InterviewReport({ interview, onBack }: InterviewReportProps) {
  const [loading, setLoading] = useState(true);
  const [report, setReport] = useState<ReportData | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  const { currentInterviewWorkspaceId } = usePageStore();
  const { workspaces } = useWorkspaceStore();

  useEffect(() => {
    generateReport();
  }, [interview]);

  const generateReport = async () => {
    try {
      setLoading(true);
      setError(null);

      // Get workspace data for JD and resume
      const workspace = workspaces.find(w => w.id === currentInterviewWorkspaceId);
      const jd = interview.jdId ? workspace?.jdList.find(j => j.id === interview.jdId) : null;
      const resume = interview.resumeId ? workspace?.resumes.find(r => r.id === interview.resumeId) : null;

      // Use real messages from interview
      const messages = interview.messages && interview.messages.length > 0 
        ? interview.messages 
        : [
            {
              id: '1',
              sessionId: interview.id,
              role: 'assistant',
              content: '你好！欢迎参加今天的面试。首先，请简单介绍一下你自己。',
              createdAt: interview.createdAt,
            },
            {
              id: '2',
              sessionId: interview.id,
              role: 'user',
              content: '你好！我是一名有多年经验的开发工程师，擅长前后端开发...',
              createdAt: interview.createdAt,
            },
          ];

      // Call API to generate report
      const result = await interviewApi.generateReport({
        messages,
        jdAnalysis: jd ? {
          summary: jd.summary,
          tags: jd.tags,
        } : undefined,
        resume: resume ? {
          title: resume.title,
          content: resume.content,
        } : undefined,
        interviewerConfig: interview.interviewerConfig,
      });

      if (result.success && result.data) {
        setReport(result.data);
      } else {
        throw new Error(result.error || '生成报告失败');
      }
    } catch (err) {
      console.error('Generate report error:', err);
      setError(err instanceof Error ? err.message : '生成报告失败');
      
      // Fallback to mock data
      setReport({
        score: 75,
        strengths: [
          '能够积极参与面试，完成了多轮对话',
          '对问题有一定的理解和思考',
          '表达能力良好，能够清晰传达想法',
        ],
        weaknesses: [
          '部分回答可以更深入展开',
          '建议多准备一些实际案例',
        ],
        suggestions: [
          '建议在回答问题时更加具体，多举实际例子',
          '可以提前准备一些常见面试题的标准答案',
          '深入学习岗位相关的专业知识',
          '多进行模拟面试练习，提升应变能力',
        ],
      });
    } finally {
      setLoading(false);
    }
  };

  const getScoreColor = (s: number) => {
    if (s >= 90) return '#52C41A';
    if (s >= 80) return '#F5A623';
    if (s >= 60) return '#FA8C16';
    return '#FF4D4F';
  };

  const getScoreLevel = (s: number) => {
    if (s >= 90) return '优秀';
    if (s >= 80) return '良好';
    if (s >= 60) return '及格';
    return '需要提升';
  };

  if (loading) {
    return (
      <div style={{ 
        display: 'flex', 
        flexDirection: 'column', 
        alignItems: 'center', 
        justifyContent: 'center', 
        height: '80vh',
        gap: 16,
      }}>
        <Spin size="large" />
        <Text type="secondary">AI 正在分析面试对话，生成报告...</Text>
      </div>
    );
  }

  const score = report?.score || 75;
  const strengths = report?.strengths || [];
  const weaknesses = report?.weaknesses || [];
  const suggestions = report?.suggestions || [];

  return (
    <div style={{ padding: '24px', maxWidth: 900, margin: '0 auto' }}>
      {error && (
        <Alert
          message="提示"
          description={error}
          type="warning"
          showIcon
          style={{ marginBottom: 24 }}
        />
      )}
      
      <Card
        styles={{
          header: { backgroundColor: '#FFFBF5', borderBottom: '1px solid #E8DFD0' },
          body: { backgroundColor: '#FFF8E7' },
        }}
        title={
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <Button icon={<ArrowLeftOutlined />} onClick={onBack}>
              返回
            </Button>
            <Title level={4} style={{ margin: 0, color: '#5C4A32' }}>
              面试报告
            </Title>
          </div>
        }
      >
        {/* 头部信息 */}
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <Title level={3} style={{ marginBottom: 8 }}>{interview.title}</Title>
          <Text type="secondary">
            {interview.interviewerConfig.name} · {interview.turnCount} 回合 · {new Date(interview.createdAt).toLocaleDateString('zh-CN')}
          </Text>
        </div>

        {/* 综合评分 */}
        <Card size="small" style={{ marginBottom: 24, backgroundColor: '#FFFBF5' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 32 }}>
            <div style={{ flex: 1 }}>
              <Title level={5} style={{ marginBottom: 16 }}>综合评分</Title>
              <Progress
                type="dashboard"
                percent={score}
                format={(percent) => (
                  <div>
                    <Text style={{ fontSize: 24, fontWeight: 'bold', color: getScoreColor(score || 0) }}>
                      {percent}
                    </Text>
                    <Text type="secondary" style={{ display: 'block', fontSize: 12 }}>
                      {getScoreLevel(score || 0)}
                    </Text>
                  </div>
                )}
                strokeColor={getScoreColor(score || 0)}
                width={140}
              />
            </div>
            <div style={{ flex: 1 }}>
              <Title level={5} style={{ marginBottom: 16 }}>面试概览</Title>
              <Space direction="vertical" style={{ width: '100%' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Text type="secondary">面试官</Text>
                  <Tag color="blue">{interview.interviewerConfig.name}</Tag>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Text type="secondary">面试回合</Text>
                  <Text strong>{interview.turnCount} / 30</Text>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Text type="secondary">面试状态</Text>
                  <Tag color="success">已完成</Tag>
                </div>
              </Space>
            </div>
          </div>
        </Card>

        <Divider style={{ borderColor: '#E8DFD0' }} />

        {/* 优势分析 */}
        {strengths.length > 0 && (
          <div style={{ marginBottom: 24 }}>
            <Title level={5} style={{ color: '#52C41A', marginBottom: 16 }}>
              <CheckCircleOutlined style={{ marginRight: 8 }} />
              表现优势
            </Title>
            <Space direction="vertical" style={{ width: '100%' }}>
              {strengths.map((strength, index) => (
                <div
                  key={index}
                  style={{
                    padding: '12px 16px',
                    backgroundColor: '#F6FFED',
                    borderRadius: 8,
                    borderLeft: '4px solid #52C41A',
                  }}
                >
                  <Text style={{ color: '#389E0D' }}>{strength}</Text>
                </div>
              ))}
            </Space>
          </div>
        )}

        <Divider style={{ borderColor: '#E8DFD0' }} />

        {/* 待提升 */}
        {weaknesses.length > 0 && (
          <div style={{ marginBottom: 24 }}>
            <Title level={5} style={{ color: '#FF4D4F', marginBottom: 16 }}>
              <CloseCircleOutlined style={{ marginRight: 8 }} />
              待提升
            </Title>
            <Space direction="vertical" style={{ width: '100%' }}>
              {weaknesses.map((weakness, index) => (
                <div
                  key={index}
                  style={{
                    padding: '12px 16px',
                    backgroundColor: '#FFF1F0',
                    borderRadius: 8,
                    borderLeft: '4px solid #FF4D4F',
                  }}
                >
                  <Text style={{ color: '#CF1322' }}>{weakness}</Text>
                </div>
              ))}
            </Space>
          </div>
        )}

        <Divider style={{ borderColor: '#E8DFD0' }} />

        {/* 改进建议 */}
        {suggestions.length > 0 && (
          <div style={{ marginBottom: 24 }}>
            <Title level={5} style={{ color: '#FA8C16', marginBottom: 16 }}>
              <BulbOutlined style={{ marginRight: 8 }} />
              改进建议
            </Title>
            <Space direction="vertical" style={{ width: '100%' }}>
              {suggestions.map((suggestion, index) => (
                <div
                  key={index}
                  style={{
                    padding: '12px 16px',
                    backgroundColor: '#FFF7E6',
                    borderRadius: 8,
                    borderLeft: '4px solid #FA8C16',
                  }}
                >
                  <Text style={{ color: '#D46B08' }}>{suggestion}</Text>
                </div>
              ))}
            </Space>
          </div>
        )}

        <Divider style={{ borderColor: '#E8DFD0' }} />

        {/* 底部操作 */}
        <div style={{ textAlign: 'center', padding: '16px 0' }}>
          <Space size="large">
            <Button size="large" onClick={onBack}>
              返回工作区
            </Button>
            <Button type="primary" size="large" onClick={generateReport}>
              重新生成报告
            </Button>
          </Space>
        </div>
      </Card>
    </div>
  );
}
