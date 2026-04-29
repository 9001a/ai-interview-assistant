'use client';

import { useState } from 'react';
import {
  Card,
  Button,
  Tag,
  Space,
  Typography,
  Modal,
  Form,
  Select,
  Radio,
  Empty,
  Badge,
  Tooltip,
  Popconfirm,
  Input,
} from 'antd';
import {
  MessageOutlined,
  PlusOutlined,
  PlayCircleOutlined,
  FileTextOutlined,
  DeleteOutlined,
  EyeOutlined,
  BookOutlined,
} from '@ant-design/icons';
import { useWorkspaceStore } from '@/stores/workspaceStore';
import { WorkspaceInterview, InterviewerConfig } from '@/types';
import { useRouter } from 'next/navigation';

const { Title, Text } = Typography;

// 默认面试官配置
const defaultInterviewerConfigs: InterviewerConfig[] = [
  {
    name: '专业型面试官',
    type: 'professional',
    style: '专业严谨',
    tone: '正式专业',
    expression: '直接明确',
    questionStyle: '技术深度',
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
  },
  {
    name: '友好型面试官',
    type: 'friendly',
    style: '温和友善',
    tone: '轻松鼓励',
    expression: '耐心引导',
    questionStyle: '循序渐进',
    features: {
      correctErrors: true,
      giveAnswers: true,
      askFollowUps: false,
      giveFeedback: true,
      doScoring: true,
    },
    focusAreas: {
      technical: true,
      project: true,
      softSkills: true,
      career: false,
    },
  },
  {
    name: '压力型面试官',
    type: 'strict',
    style: '严肃苛刻',
    tone: '直接犀利',
    expression: '挑战性质疑',
    questionStyle: '连环追问',
    features: {
      correctErrors: false,
      giveAnswers: false,
      askFollowUps: true,
      giveFeedback: false,
      doScoring: true,
    },
    focusAreas: {
      technical: true,
      project: true,
      softSkills: false,
      career: false,
    },
  },
];

// 模拟知识库数据（实际应从知识库store获取）
const mockKnowledgeBases = [
  { id: 'none', name: '不使用知识库' },
  { id: 'backend', name: '后端面试题库' },
  { id: 'frontend', name: '前端面试题库' },
  { id: 'algorithm', name: '算法面试题库' },
  { id: 'java', name: 'Java面试题库' },
];

export default function InterviewPanel() {
  const router = useRouter();
  const {
    currentWorkspace,
    startNewInterview,
    removeInterview,
    getSelectedJDs,
    getSelectedResume,
  } = useWorkspaceStore();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);

  if (!currentWorkspace) {
    return (
      <Empty description="请先选择或创建工作区" style={{ marginTop: 100 }} />
    );
  }

  const handleStartInterview = async (values: {
    jdId: string;
    resumeId: string;
    knowledgeBaseId: string;
    interviewerType: string;
    title: string;
  }) => {
    setLoading(true);

    const interviewerConfig =
      defaultInterviewerConfigs.find((c) => c.type === values.interviewerType) ||
      defaultInterviewerConfigs[0];

    const interview = startNewInterview(currentWorkspace.id, {
      title: values.title,
      jdId: values.jdId,
      resumeId: values.resumeId,
      knowledgeBaseId: values.knowledgeBaseId === 'none' ? undefined : values.knowledgeBaseId,
      interviewerConfig,
    });

    setLoading(false);
    setIsModalOpen(false);
    form.resetFields();

    // 跳转到面试页面
    router.push(`/interview/${interview.id}`);
  };

  const getStatusTag = (status: WorkspaceInterview['status']) => {
    switch (status) {
      case 'ongoing':
        return <Badge status="processing" text="进行中" />;
      case 'completed':
        return <Badge status="success" text="已完成" />;
      case 'paused':
        return <Badge status="warning" text="已暂停" />;
      default:
        return <Badge status="default" text="未知" />;
    }
  };

  const getJDTitle = (jdId?: string) => {
    if (!jdId) return '未选择JD';
    const jd = currentWorkspace.jdList.find((j) => j.id === jdId);
    return jd ? jd.title.substring(0, 30) + '...' : '未知JD';
  };

  const getResumeTitle = (resumeId?: string) => {
    if (!resumeId) return '未选择简历';
    const resume = currentWorkspace.resumes.find((r) => r.id === resumeId);
    return resume ? resume.title : '未知简历';
  };

  return (
    <div style={{ padding: '24px' }}>
      <Card
        title={
          <Space>
            <MessageOutlined style={{ color: '#fa8c16' }} />
            <span>面试记录</span>
            <Tag color="blue">{currentWorkspace.interviews.length}</Tag>
          </Space>
        }
        extra={
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => setIsModalOpen(true)}
            disabled={currentWorkspace.jdList.length === 0 || currentWorkspace.resumes.length === 0}
          >
            开始新面试
          </Button>
        }
      >
        {currentWorkspace.interviews.length === 0 ? (
          <Empty
            description={
              <Space direction="vertical" size="small">
                <Text type="secondary">暂无面试记录</Text>
                <Text type="secondary" style={{ fontSize: 12 }}>
                  先添加JD和简历，然后开始面试
                </Text>
              </Space>
            }
            style={{ marginTop: 40, marginBottom: 40 }}
          >
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => setIsModalOpen(true)}
              disabled={currentWorkspace.jdList.length === 0 || currentWorkspace.resumes.length === 0}
            >
              开始新面试
            </Button>
          </Empty>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {currentWorkspace.interviews.map((interview) => (
              <div
                key={interview.id}
                style={{
                  padding: 16,
                  border: '1px solid #f0f0f0',
                  borderRadius: 8,
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <Space>
                      <Text strong>{interview.title}</Text>
                      {getStatusTag(interview.status)}
                      {interview.score !== undefined && (
                        <Tag color="green">得分: {interview.score}</Tag>
                      )}
                    </Space>
                    <Space direction="vertical" size={0} style={{ marginTop: 8 }}>
                      <Space size="small">
                        <FileTextOutlined style={{ color: '#8c8c8c' }} />
                        <Text type="secondary" style={{ fontSize: 12 }}>
                          JD: {getJDTitle(interview.jdId)}
                        </Text>
                      </Space>
                      <Space size="small">
                        <FileTextOutlined style={{ color: '#8c8c8c' }} />
                        <Text type="secondary" style={{ fontSize: 12 }}>
                          简历: {getResumeTitle(interview.resumeId)}
                        </Text>
                      </Space>
                      {interview.knowledgeBaseId && (
                        <Space size="small">
                          <BookOutlined style={{ color: '#8c8c8c' }} />
                          <Text type="secondary" style={{ fontSize: 12 }}>
                            知识库:{' '}
                            {mockKnowledgeBases.find((k) => k.id === interview.knowledgeBaseId)?.name || '未知'}
                          </Text>
                        </Space>
                      )}
                      <Space size="small" style={{ marginTop: 4 }}>
                        <Tag color="blue">
                          {interview.interviewerConfig.name}
                        </Tag>
                        <Text type="secondary" style={{ fontSize: 12 }}>
                          回合: {interview.turnCount}
                        </Text>
                        <Text type="secondary" style={{ fontSize: 12 }}>
                          {new Date(interview.createdAt).toLocaleString()}
                        </Text>
                      </Space>
                    </Space>
                  </div>
                  <Space>
                    {interview.status === 'ongoing' ? (
                      <Button
                        type="primary"
                        icon={<PlayCircleOutlined />}
                        size="small"
                        onClick={() => router.push(`/interview/${interview.id}`)}
                      >
                        继续
                      </Button>
                    ) : (
                      <Button
                        icon={<EyeOutlined />}
                        size="small"
                        onClick={() => router.push(`/interview/${interview.id}/report`)}
                      >
                        查看报告
                      </Button>
                    )}
                    <Popconfirm
                      title="删除面试记录"
                      description="确定要删除这条面试记录吗？"
                      onConfirm={() => removeInterview(currentWorkspace.id, interview.id)}
                      okText="删除"
                      cancelText="取消"
                      okButtonProps={{ danger: true }}
                    >
                      <Button icon={<DeleteOutlined />} size="small" danger>
                        删除
                      </Button>
                    </Popconfirm>
                  </Space>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* 开始面试弹窗 */}
      <Modal
        title="开始新面试"
        open={isModalOpen}
        onCancel={() => {
          setIsModalOpen(false);
          form.resetFields();
        }}
        footer={null}
        width={600}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleStartInterview}
          initialValues={{
            interviewerType: 'professional',
            knowledgeBaseId: 'none',
          }}
        >
          <Form.Item
            name="title"
            label="面试标题"
            rules={[{ required: true, message: '请输入面试标题' }]}
          >
            <Input placeholder="例如：字节一面、阿里二面" />
          </Form.Item>

          <Form.Item
            name="jdId"
            label="选择JD"
            rules={[{ required: true, message: '请选择JD' }]}
          >
            <Select placeholder="选择要面试的JD">
              {currentWorkspace.jdList.map((jd) => (
                <Select.Option key={jd.id} value={jd.id}>
                  {jd.title.substring(0, 50)}...
                </Select.Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item
            name="resumeId"
            label="选择简历"
            rules={[{ required: true, message: '请选择简历' }]}
          >
            <Select placeholder="选择要使用的简历">
              {currentWorkspace.resumes.map((resume) => (
                <Select.Option key={resume.id} value={resume.id}>
                  {resume.title}
                </Select.Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item name="knowledgeBaseId" label="知识库（可选）">
            <Select placeholder="选择知识库">
              {mockKnowledgeBases.map((kb) => (
                <Select.Option key={kb.id} value={kb.id}>
                  {kb.name}
                </Select.Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item name="interviewerType" label="面试官类型">
            <Radio.Group>
              <Space direction="vertical">
                {defaultInterviewerConfigs.map((config) => (
                  <Radio key={config.type} value={config.type}>
                    <Space direction="vertical" size={0}>
                      <Text strong>{config.name}</Text>
                      <Text type="secondary" style={{ fontSize: 12 }}>
                        {config.style} · {config.questionStyle}
                      </Text>
                    </Space>
                  </Radio>
                ))}
              </Space>
            </Radio.Group>
          </Form.Item>

          <Form.Item style={{ marginBottom: 0, textAlign: 'right' }}>
            <Space>
              <Button onClick={() => setIsModalOpen(false)}>取消</Button>
              <Button type="primary" htmlType="submit" loading={loading}>
                开始面试
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
