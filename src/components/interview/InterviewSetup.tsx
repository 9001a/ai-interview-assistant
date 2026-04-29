'use client';

import { Modal, Form, Select, Radio, Button, Space, Divider, Typography, Alert } from 'antd';
import { useState } from 'react';
import type { JDAnalysis, Resume, InterviewerConfig, KnowledgeDocument } from '@/types';

const { Title, Text } = Typography;
const { Option } = Select;
const { Group: RadioGroup, Button: RadioButton } = Radio;

interface InterviewSetupProps {
  open: boolean;
  onCancel: () => void;
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
  type: InterviewerConfig['type'];
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
];

export default function InterviewSetup({
  open,
  onCancel,
  onStart,
  jdOptions,
  resumeOptions,
  knowledgeBaseOptions,
}: InterviewSetupProps) {
  const [form] = Form.useForm();
  const [interviewerType, setInterviewerType] = useState<InterviewerConfig['type']>('professional');

  const handleOk = () => {
    form.validateFields().then((values) => {
      const selectedJD = jdOptions.find(o => o.value === values.jdId);
      const selectedResume = resumeOptions.find(o => o.value === values.resumeId);
      const selectedKB = knowledgeBaseOptions.find(o => o.value === values.knowledgeBaseId);

      const interviewerConfig: InterviewerConfig = {
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
      };

      onStart({
        jd: selectedJD?.jd || null,
        resume: selectedResume?.resume || null,
        knowledgeBase: selectedKB?.kb || null,
        interviewerConfig,
      });
    });
  };

  return (
    <Modal
      title={
        <Title level={4} style={{ margin: 0 }}>
          开始面试
        </Title>
      }
      open={open}
      onCancel={onCancel}
      onOk={handleOk}
      okText="开始面试"
      cancelText="取消"
      width={680}
    >
      <Form form={form} layout="vertical">
        <Alert
          message="请选择面试配置"
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
            {INTERVIEWER_TYPES.map(type => (
              <RadioButton key={type.type} value={type.type} style={{ width: '33.33%' }}>
                {type.name}
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
        </div>
      </Form>
    </Modal>
  );
}
