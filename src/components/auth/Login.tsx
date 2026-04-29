'use client';

import { useState } from 'react';
import {
  Card,
  Form,
  Input,
  Button,
  Typography,
  message,
  Row,
  Col,
  Alert,
} from 'antd';
import { UserOutlined, LockOutlined } from '@ant-design/icons';
import { useAuthStore } from '@/stores/authStore';
import { authApi } from '@/services/api';

const { Title, Text } = Typography;

export default function Login() {
  const [step, setStep] = useState<'email' | 'verify'>('email');
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [storedCode, setStoredCode] = useState<string>('');
  const login = useAuthStore((state) => state.login);

  // 发送验证码
  const handleSendCode = async (values: { email: string }) => {
    setLoading(true);
    try {
      const res = await authApi.sendCode(values.email);
      setEmail(values.email);
      
      // 开发阶段保存显示的验证码
      if (res.data?.code) {
        setStoredCode(res.data.code);
      }
      
      setStep('verify');
      message.success('验证码已发送！（开发阶段：123456 或查看控制台）');
    } catch (error: any) {
      message.error(error.response?.data?.error || '发送失败');
    } finally {
      setLoading(false);
    }
  };

  // 验证并登录
  const handleVerify = async (values: { code: string }) => {
    setLoading(true);
    try {
      const res = await authApi.verifyCode(email, values.code);
      const data = res.data || res;

      if (data.token && data.user) {
        login(data.user, data.token);
        message.success('登录成功！👋 欢迎回来');
      }
    } catch (error: any) {
      message.error(error.response?.data?.error || '验证失败');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-amber-50 to-orange-50 p-4">
      <Card 
        className="w-full max-w-md shadow-lg" 
        style={{ borderRadius: '16px' }}
        styles={{ body: { padding: '32px' } }}
      >
        <div className="text-center mb-8">
          <div className="text-5xl mb-4">🎯</div>
          <Title level={2} style={{ color: '#5C4A32', margin: 0 }}>
            AI求职全链路助手
          </Title>
          <Text type="secondary" className="mt-2 block">
            助力你轻松搞定面试准备
          </Text>
        </div>

        {step === 'email' ? (
          <Form
            name="send_code"
            onFinish={handleSendCode}
            autoComplete="off"
            size="large"
            layout="vertical"
          >
            <Alert
              title="温馨提示"
              description={
                <span>
                  开发阶段可以用邮箱 <strong>123456</strong> 作为验证码快速登录，
                  或者输入真实邮箱获取验证码
                </span>
              }
              type="info"
              showIcon
              className="mb-6"
            />

            <Form.Item
              name="email"
              label="邮箱地址"
              rules={[
                { required: true, message: '请输入邮箱地址' },
                { type: 'email', message: '请输入有效的邮箱地址' }
              ]}
            >
              <Input 
                prefix={<UserOutlined />} 
                placeholder="请输入邮箱"
                autoComplete="email"
              />
            </Form.Item>

            <Form.Item>
              <Button 
                type="primary" 
                htmlType="submit" 
                loading={loading}
                block
                size="large"
                style={{ 
                  backgroundColor: '#F5A623', 
                  borderColor: '#F5A623',
                  height: '48px',
                  borderRadius: '12px'
                }}
              >
                发送验证码
              </Button>
            </Form.Item>
          </Form>
        ) : (
          <Form
            name="verify_code"
            onFinish={handleVerify}
            autoComplete="off"
            size="large"
            layout="vertical"
          >
            <div className="mb-6">
              <Text type="secondary">
                验证码已发送至 <strong>{email}</strong>
              </Text>
              <Button 
                type="link" 
                size="small" 
                onClick={() => setStep('email')}
                className="pl-0"
              >
                修改邮箱
              </Button>
            </div>

            {storedCode && (
              <Alert
                title="开发阶段验证码"
                description={`开发验证码: ${storedCode}（或直接输入 123456）`}
                type="success"
                showIcon
                className="mb-6"
              />
            )}

            <Form.Item
              name="code"
              label="验证码"
              rules={[
                { required: true, message: '请输入验证码' },
                { len: 6, message: '请输入 6 位验证码' }
              ]}
            >
              <Input 
                prefix={<LockOutlined />} 
                placeholder="请输入 6 位验证码"
                maxLength={6}
                autoComplete="one-time-code"
              />
            </Form.Item>

            <Form.Item>
              <Button 
                type="primary" 
                htmlType="submit" 
                loading={loading}
                block
                size="large"
                style={{ 
                  backgroundColor: '#F5A623', 
                  borderColor: '#F5A623',
                  height: '48px',
                  borderRadius: '12px'
                }}
              >
                登录
              </Button>
            </Form.Item>
          </Form>
        )}

        <div className="text-center mt-8">
          <Row justify="center" gutter={[8, 8]}>
            <Col>☀️ 暖黄色主题</Col>
            <Col>•</Col>
            <Col>✨ 智能面试</Col>
            <Col>•</Col>
            <Col>💪 助力准备</Col>
          </Row>
        </div>
      </Card>
    </div>
  );
}
