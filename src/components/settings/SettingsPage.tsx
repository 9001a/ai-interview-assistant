'use client';

import { useState } from 'react';
import {
  Card,
  Form,
  Input,
  Button,
  Typography,
  Switch,
  message,
  Space,
  Collapse,
  Tag,
  Alert,
  Divider,
} from 'antd';
import {
  SaveOutlined,
  KeyOutlined,
  SettingOutlined,
  UserOutlined,
  FileTextOutlined,
  RobotOutlined,
} from '@ant-design/icons';
import { useInterviewStore } from '@/stores/interviewStore';
import type { InterviewerConfig } from '@/types';
import InterviewerConfigPanel from './InterviewerConfigPanel';

const { Title, Text } = Typography;
const { TextArea } = Input;
const { Panel } = Collapse;

// JD 分析师设置组件（占位）
function JDAnalyzerSettings() {
  return (
    <Space direction="vertical" style={{ width: '100%' }}>
      <Alert
        message="功能开发中"
        description="JD 分析师的详细配置将在这里提供，包括分析模型选择、分析维度配置等。"
        type="info"
        showIcon
      />
      <Card size="small" title="基础配置" style={{ backgroundColor: '#fafafa' }}>
        <Form layout="vertical">
          <Form.Item label="分析模型">
            <Input placeholder="gpt-4o-mini" disabled />
          </Form.Item>
          <Form.Item label="分析深度">
            <Input placeholder="标准" disabled />
          </Form.Item>
        </Form>
      </Card>
    </Space>
  );
}

// 系统设置组件
function SystemSettings() {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [showKey, setShowKey] = useState(false);

  const handleSave = async (values: any) => {
    setLoading(true);
    try {
      // 保存到 localStorage
      localStorage.setItem('app_settings', JSON.stringify(values));
      await new Promise((resolve) => setTimeout(resolve, 500));
      message.success('系统设置保存成功！');
    } catch (error) {
      message.error('保存失败');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Form
      form={form}
      layout="vertical"
      onFinish={handleSave}
      initialValues={{
        apiKey: '',
        apiBase: 'https://api.openai.com/v1',
        autoSave: true,
        theme: 'warm',
      }}
    >
      <Card
        type="inner"
        title={
          <Space>
            <KeyOutlined />
            <span>API 配置</span>
          </Space>
        }
        style={{ marginBottom: 16 }}
      >
        <Form.Item
          name="apiKey"
          label="OpenAI API Key"
          rules={[{ required: true, message: '请输入 API Key' }]}
          tooltip="请输入您的 OpenAI API Key，系统会安全存储在本地"
        >
          <Input.Password
            placeholder="sk-..."
            prefix={<KeyOutlined />}
            iconRender={(visible) => (
              <span onClick={() => setShowKey(!visible)}>
                {visible ? '🙈' : '👁️'}
              </span>
            )}
            visibilityToggle={false}
            style={{ height: 44 }}
          />
        </Form.Item>

        <Form.Item
          name="apiBase"
          label="API Base URL"
          tooltip="如果需要使用第三方 API 服务，请修改此项"
        >
          <Input placeholder="https://api.openai.com/v1" style={{ height: 44 }} />
        </Form.Item>

        <Text type="secondary" style={{ fontSize: 13 }}>
          💡 提示：您的 API Key 仅在本地安全存储，不会上传到服务器
        </Text>
      </Card>

      <Card
        type="inner"
        title={
          <Space>
            <SettingOutlined />
            <span>通用设置</span>
          </Space>
        }
        style={{ marginBottom: 16 }}
      >
        <Form.Item name="autoSave" label="自动保存" valuePropName="checked">
          <Switch checkedChildren="开" unCheckedChildren="关" defaultChecked />
        </Form.Item>

        <Form.Item name="theme" label="主题风格">
          <Space>
            <Tag color="orange">暖色调</Tag>
            <Text type="secondary">更多主题开发中...</Text>
          </Space>
        </Form.Item>
      </Card>

      <Form.Item>
        <Button
          type="primary"
          htmlType="submit"
          loading={loading}
          icon={<SaveOutlined />}
        >
          保存系统设置
        </Button>
      </Form.Item>
    </Form>
  );
}

export default function SettingsPage() {
  const setInterviewerConfig = useInterviewStore((state) => state.setInterviewerConfig);

  const handleSaveInterviewerConfig = (config: InterviewerConfig) => {
    setInterviewerConfig(config);
    // 同时保存到 localStorage 以便持久化
    localStorage.setItem('interviewer_config', JSON.stringify(config));
  };

  return (
    <div style={{ maxWidth: 900, margin: '0 auto' }}>
      <Title level={3} style={{ marginBottom: 24 }}>
        <SettingOutlined style={{ marginRight: 12, color: '#F5A623' }} />
        设置中心
      </Title>

      <Collapse
        defaultActiveKey={['interviewer']}
        style={{ backgroundColor: '#fff', borderRadius: 8 }}
        items={[
          {
            key: 'system',
            label: (
              <Space>
                <SettingOutlined style={{ color: '#F5A623' }} />
                <Text strong>系统设置</Text>
                <Tag style={{ fontSize: 12, padding: '0 6px', lineHeight: '18px' }}>API、主题</Tag>
              </Space>
            ),
            children: <SystemSettings />,
          },
          {
            key: 'jd-analyzer',
            label: (
              <Space>
                <FileTextOutlined style={{ color: '#52c41a' }} />
                <Text strong>JD 分析师设置</Text>
                <Tag color="default" style={{ fontSize: 12, padding: '0 6px', lineHeight: '18px' }}>
                  开发中
                </Tag>
              </Space>
            ),
            children: <JDAnalyzerSettings />,
          },
          {
            key: 'interviewer',
            label: (
              <Space>
                <RobotOutlined style={{ color: '#1890ff' }} />
                <Text strong>面试官设置</Text>
                <Tag color="processing" style={{ fontSize: 12, padding: '0 6px', lineHeight: '18px' }}>
                  4种模式
                </Tag>
              </Space>
            ),
            children: (
              <InterviewerConfigPanel onSave={handleSaveInterviewerConfig} />
            ),
          },
        ]}
      />

      <Divider style={{ margin: '32px 0' }} />

      <Card style={{ borderRadius: 16 }}>
        <Title level={5} style={{ marginBottom: 16 }}>
          关于
        </Title>
        <Text type="secondary">
          <p>AI 求职全链路助手 v1.0</p>
          <p>帮助您更好地准备面试，提高面试成功率</p>
        </Text>
        <Space style={{ marginTop: 8 }}>
          <Tag color="orange">RAG 知识库</Tag>
          <Tag color="blue">AI 面试官</Tag>
          <Tag color="green">简历优化</Tag>
        </Space>
      </Card>
    </div>
  );
}
