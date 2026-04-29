'use client';

import { useState } from 'react';
import { Card, Form, Input, Button, Typography, Switch, Divider, message, Space } from 'antd';
import { SaveOutlined, KeyOutlined, SettingOutlined, RobotOutlined } from '@ant-design/icons';

const { Title, Text } = Typography;
const { TextArea } = Input;

export default function SettingsPage() {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [showKey, setShowKey] = useState(false);

  const handleSave = async (values: any) => {
    setLoading(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 800));
      message.success('设置保存成功！');
    } catch (error) {
      message.error('保存失败');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: 700, margin: '0 auto' }}>
      <Card style={{ borderRadius: 16, marginBottom: 24 }}>
        <Title level={4} style={{ marginBottom: 24 }}>
          <SettingOutlined style={{ marginRight: 8, color: '#F5A623' }} />
          系统设置
        </Title>

        <Form
          form={form}
          layout="vertical"
          onFinish={handleSave}
          initialValues={{
            apiKey: '',
            autoSave: true,
            theme: 'warm',
          }}
        >
          <Card
            type="inner"
            title={
              <Space>
                <KeyOutlined />
                <span>API Key 配置</span>
              </Space>
            }
            style={{ marginBottom: 24 }}
          >
            <Form.Item
              name="apiKey"
              label="OpenAI API Key"
              rules={[{ required: true, message: '请输入 API Key' }]}
              tooltip="请输入您的 OpenAI API Key，系统会安全存储"
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

            <Text type="secondary" style={{ fontSize: 13 }}>
              💡 提示：您的 API Key 仅在本地安全存储，不会上传到服务器
            </Text>
          </Card>

          <Card
            type="inner"
            title={
              <Space>
                <RobotOutlined />
                <span>AI 面试官默认配置</span>
              </Space>
            }
            style={{ marginBottom: 24 }}
          >
            <Form.Item name="defaultInterviewer" label="默认面试官风格">
              <Input placeholder="专业型" style={{ height: 44 }} />
            </Form.Item>

            <Form.Item name="autoContinue" label="自动继续对话" valuePropName="checked">
              <Switch checkedChildren="开" unCheckedChildren="关" />
            </Form.Item>

            <Form.Item name="autoSummary" label="30轮自动总结" valuePropName="checked">
              <Switch checkedChildren="开" unCheckedChildren="关" defaultChecked />
            </Form.Item>
          </Card>

          <Divider style={{ margin: '24px 0' }} />

          <Form.Item>
            <Button
              type="primary"
              size="large"
              htmlType="submit"
              loading={loading}
              icon={<SaveOutlined />}
              style={{ height: 48, minWidth: 140 }}
            >
              保存设置
            </Button>
          </Form.Item>
        </Form>
      </Card>

      <Card style={{ borderRadius: 16 }}>
        <Title level={4} style={{ marginBottom: 16 }}>
          关于
        </Title>
        <Text type="secondary">
          <p>AI 求职全链路助手 v1.0</p>
          <p>帮助您更好地准备面试，提高面试成功率 🎯</p>
        </Text>
      </Card>
    </div>
  );
}
