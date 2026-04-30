'use client';

import { Card, Form, Select, Radio, Button, Space, Divider, Typography, Alert, Tag } from 'antd';
import { useState } from 'react';
import { useInterviewStore } from '@/stores/interviewStore';
import type { JDAnalysis, Resume, InterviewerConfig, KnowledgeDocument } from '@/types';

const { Title, Text } = Typography;
const { Option } = Select;
const { Group: RadioGroup, Button: RadioButton } = Radio;

interface InterviewSetupProps {
  onStart: (config: {
    jd: JDAnalysis | null;
    resume: Resume | null;
    knowledgeBase: KnowledgeDocument | null;
    interviewerConfig: InterviewerConfig;
  }) => void;
  jdOptions: Array<{ value: string; label: string; jd: JDAnalysis }>;
  resumeOptions: Array<{ value: string; label: string; resume: Resume }>;
  knowledgeBaseOptions: Array<{ value: string; label: string; kb: KnowledgeDocument }>;
}

const INTERVIEWER_TYPES: Array<{
  type: InterviewerConfig['type'] | 'custom';
  name: string;
  description: string;
}> = [
  {
    type: 'professional',
    name: '专业型',
    description: '专业严谨，直接提问，注重技术细节',
  },
  {
    type: 'friendly',
    name: '友好型',
    description: '温和引导，逐步深入，注重沟通',
  },
  {
    type: 'stress',
    name: '压力型',
    description: '多轮追问，考察抗压，快速反应',
  },
  {
    type: 'custom',
    name: '我的自定义',
    description: '使用我在设置页面配置的面试官风格',
  },
];

export default function InterviewSetup({
  onStart,
  jdOptions,
  resumeOptions,
  knowledgeBaseOptions,
}: InterviewSetupProps) {
  const [form] = Form.useForm();
  const [interviewerType, setInterviewerType] = useState<InterviewerConfig['type'] | 'custom'>('friendly');

  // 从 Store 读取用户保存的自定义配置
  const savedConfig = useInterviewStore((state) => state.interviewerConfig);
  const hasCustomConfig = savedConfig.systemPrompt || savedConfig.customDescription;

  const handleSubmit = () => {
    form.validateFields().then((values) => {
      const selectedJD = jdOptions.find(o => o.value === values.jdId);
      const selectedResume = resumeOptions.find(o => o.value === values.resumeId);
      const selectedKB = knowledgeBaseOptions.find(o => o.value === values.knowledgeBaseId);

      let interviewerConfig: InterviewerConfig;

      if (interviewerType === 'custom') {
        // 使用用户自定义配置
        interviewerConfig = savedConfig;
      } else {
        // 使用预设配置，但如果有 systemPrompt 也保留
        interviewerConfig = {
          name: INTERVIEWER_TYPES.find(t => t.type === interviewerType)?.name || '专业型面试官',
          type: interviewerType,
          style: interviewerType === 'professional' ? '专业严谨' :
                 interviewerType === 'friendly' ? '温和引导' : '压力测试',
          tone: interviewerType === 'professional' ? '正式' :
                interviewerType === 'friendly' ? '温和' : '尖锐',
          expression: interviewerType === 'professional' ? '专业且简洁' :
                     interviewerType === 'friendly' ? '鼓励式' : '挑战性',
          questionStyle: interviewerType === 'professional' ? '直接提问' :
                          interviewerType === 'friendly' ? '逐步深入' : '连续追问',
          features: {
            correctErrors: true,
            giveAnswers: true,
            askFollowUps: true,
            giveFeedback: true,
            doScoring: interviewerType === 'professional',
          },
          focusAreas: {
            technical: true,
            project: true,
            softSkills: true,
            career: false,
          },
          // 如果有保存的 systemPrompt，也应用到预设类型
          ...(savedConfig.systemPrompt && { systemPrompt: savedConfig.systemPrompt }),
        };
      }

      onStart({
        jd: selectedJD?.jd || null,
        resume: selectedResume?.resume || null,
        knowledgeBase: selectedKB?.kb || null,
        interviewerConfig,
      });
    });
  };

  return (
    <Card
      title={
        <Title level={4} style={{ margin: 0 }}>
          开始面试
        </Title>
      }
      style={{ borderRadius: 16 }}
    >
      <Form form={form} layout="vertical">
        <Alert
          title="请选择面试配置"
          description="选择 JD、简历、知识库和面试官类型"
          type="info"
          showIcon
          style={{ marginBottom: 24 }}
        />

        <Form.Item
          name="jdId"
          label="选择 JD"
          rules={[{ required: true, message: '请选择 JD' }]}
        >
          <Select placeholder="请选择 JD" showSearch>
            {jdOptions.map(opt => (
              <Option key={opt.value} value={opt.value}>
                {opt.label}
              </Option>
            ))}
          </Select>
        </Form.Item>

        <Form.Item
          name="resumeId"
          label="选择简历"
          rules={[{ required: true, message: '请选择简历' }]}
        >
          <Select placeholder="请选择简历" showSearch>
            {resumeOptions.map(opt => (
              <Option key={opt.value} value={opt.value}>
                {opt.label}
              </Option>
            ))}
          </Select>
        </Form.Item>

        <Form.Item
          name="knowledgeBaseId"
          label="选择知识库（可选）"
        >
          <Select placeholder="不使用知识库" allowClear>
            {knowledgeBaseOptions.map(opt => (
              <Option key={opt.value} value={opt.value}>
                {opt.label}
              </Option>
            ))}
          </Select>
        </Form.Item>

        <Divider />

        <Form.Item label="面试官类型">
          <RadioGroup
            value={interviewerType}
            onChange={(e) => setInterviewerType(e.target.value)}
            style={{ width: '100%' }}
          >
            {INTERVIEWER_TYPES.map((type) => (
              <RadioButton
                key={type.type}
                value={type.type}
                style={{ width: '25%' }}
              >
                <span style={{ fontSize: 13 }}>{type.name}</span>
                {type.type === 'custom' && hasCustomConfig && (
                  <Tag color="orange" style={{ marginLeft: 4, fontSize: 10, padding: '0 4px' }}>已配置</Tag>
                )}
              </RadioButton>
            ))}
          </RadioGroup>
        </Form.Item>

        <div style={{ padding: 16, backgroundColor: '#FFF8E7', borderRadius: 8 }}>
          <Text strong>
            {INTERVIEWER_TYPES.find(t => t.type === interviewerType)?.name}
          </Text>
          <br />
          <Text type="secondary" style={{ fontSize: 14 }}>
            {INTERVIEWER_TYPES.find(t => t.type === interviewerType)?.description}
          </Text>
          {interviewerType === 'custom' && savedConfig.systemPrompt && (
            <>
              <Divider style={{ margin: '12px 0' }} />
              <Text type="secondary" style={{ fontSize: 12 }}>
                自定义配置：{savedConfig.name}
                {savedConfig.customDescription && (
                  <div style={{ marginTop: 4, color: '#666' }}>
                    「{savedConfig.customDescription.substring(0, 50)}...」
                  </div>
                )}
              </Text>
            </>
          )}
        </div>
      </Form>
      <div style={{ marginTop: 24, textAlign: 'center' }}>
        <Button 
          type="primary" 
          size="large" 
          onClick={handleSubmit}
          style={{ height: 48, minWidth: 180, fontSize: 16 }}
        >
          开始面试
        </Button>
      </div>
    </Card>
  );
}
