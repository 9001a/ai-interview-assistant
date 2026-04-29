'use client';

import { Card, Typography, Button, Space, Tag, Progress, Divider } from 'antd';
import { ArrowLeftOutlined, CheckCircleOutlined, CloseCircleOutlined, BulbOutlined } from '@ant-design/icons';
import { usePageStore } from '@/stores/pageStore';
import type { WorkspaceInterview } from '@/types';

const { Title, Text, Paragraph } = Typography;

interface InterviewReportProps {
  interview: WorkspaceInterview;
  onBack: () => void;
}

export default function InterviewReport({ interview, onBack }: InterviewReportProps) {
  // Mock report data - in real app, this would be generated from the interview
  const score = interview.score || 75;
  const strengths = [
    '技术基础扎实，对核心概念理解清晰',
    '项目经验丰富，能够清晰描述项目细节',
    '沟通表达能力良好',
  ];
  const weaknesses = [
    '部分深入技术问题回答不够全面',
    '系统设计方面可以进一步提升',
  ];
  const suggestions = [
    '深入学习分布式系统相关知识',
    '多练习系统设计题目',
    '整理常见面试题的标准答案',
  ];

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

  return (
    <div style={{ padding: '24px', maxWidth: 900, margin: '0 auto' }}>
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

        <Divider style={{ borderColor: '#E8DFD0' }} />

        {/* 待提升 */}
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

        <Divider style={{ borderColor: '#E8DFD0' }} />

        {/* 改进建议 */}
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

        <Divider style={{ borderColor: '#E8DFD0' }} />

        {/* 底部操作 */}
        <div style={{ textAlign: 'center', padding: '16px 0' }}>
          <Space size="large">
            <Button size="large" onClick={onBack}>
              返回工作区
            </Button>
            <Button type="primary" size="large">
              开始新一轮面试
            </Button>
          </Space>
        </div>
      </Card>
    </div>
  );
}
