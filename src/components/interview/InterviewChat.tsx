'use client';

import { useState, useRef, useEffect } from 'react';
import { Input, Button, Spin, Space, Avatar, Typography, Badge, Card, Divider } from 'antd';
import { SendOutlined, UserOutlined, RobotOutlined, StopOutlined, ReloadOutlined } from '@ant-design/icons';
import type { ChatMessage, InterviewerConfig } from '@/types';

const { Text, Paragraph } = Typography;
const { TextArea } = Input;

interface InterviewChatProps {
  messages: ChatMessage[];
  isLoading: boolean;
  onSendMessage: (content: string) => void;
  onEndInterview: () => void;
  interviewerConfig: InterviewerConfig;
  turnCount: number;
}

export default function InterviewChat({
  messages,
  isLoading,
  onSendMessage,
  onEndInterview,
  interviewerConfig,
  turnCount,
}: InterviewChatProps) {
  const [inputValue, setInputValue] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // 自动滚动到底部
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = () => {
    if (!inputValue.trim() || isLoading) return;
    onSendMessage(inputValue);
    setInputValue('');
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', minHeight: 600 }}>
      {/* 头部 */}
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        padding: '16px 24px',
        borderBottom: '1px solid #E8DFD0',
        backgroundColor: '#FFF8E7',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <Avatar size={40} icon={<RobotOutlined />} style={{ backgroundColor: '#F5A623' }} />
          <div>
            <Text strong style={{ fontSize: 16, display: 'block' }}>
              {interviewerConfig.name}
            </Text>
            <Text type="secondary" style={{ fontSize: 13 }}>
              {interviewerConfig.style}
            </Text>
          </div>
        </div>
        <Space>
          <Badge status="processing" text={`第 ${turnCount + 1}/30 轮`} />
          <Button 
            icon={<StopOutlined />} 
            danger
            onClick={onEndInterview}
          >
            结束面试
          </Button>
        </Space>
      </div>

      {/* 聊天区域 */}
      <div style={{ 
        flex: 1, 
        overflowY: 'auto', 
        padding: '24px',
        backgroundColor: '#FFFDF8',
      }}>
        {messages.map((msg, idx) => (
          <div
            key={idx}
            style={{
              display: 'flex',
              justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start',
              marginBottom: 24,
            }}
          >
            {msg.role === 'assistant' && (
              <Avatar size={36} icon={<RobotOutlined />} style={{ backgroundColor: '#F5A623', marginRight: 12 }} />
            )}
            <Card
              size="small"
              style={{
                maxWidth: '70%',
                backgroundColor: msg.role === 'user' ? '#FFFFFF' : '#FFF8E7',
                border: '1px solid #E8DFD0',
              }}
            >
              {msg.role === 'assistant' && msg.isTyping ? (
                <div style={{ padding: 8 }}>
                  <Spin size="small" />
                  <Text type="secondary" style={{ marginLeft: 8 }}>思考中...</Text>
                </div>
              ) : (
                <div style={{ whiteSpace: 'pre-wrap' }}>
                  <Paragraph style={{ margin: 0, lineHeight: 1.8 }}>
                    {msg.content}
                  </Paragraph>
                </div>
              )}
              <div style={{ marginTop: 8, textAlign: 'right' }}>
                <Text type="secondary" style={{ fontSize: 12 }}>
                  {new Date(msg.createdAt).toLocaleTimeString()}
                </Text>
              </div>
            </Card>
            {msg.role === 'user' && (
              <Avatar size={36} icon={<UserOutlined />} style={{ backgroundColor: '#1890ff', marginLeft: 12 }} />
            )}
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      <Divider style={{ margin: 0 }} />

      {/* 输入区域 */}
      <div style={{ padding: 20, backgroundColor: '#FFFFFF' }}>
        <div style={{ display: 'flex', gap: 12, alignItems: 'flex-end' }}>
          <TextArea
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="输入你的回答..."
            autoSize={{ minRows: 2, maxRows: 6 }}
            style={{ flex: 1 }}
            disabled={isLoading}
          />
          <Space direction="vertical" style={{ height: '100%' }}>
            <Button
              type="primary"
              icon={<SendOutlined />}
              onClick={handleSend}
              loading={isLoading}
              disabled={!inputValue.trim()}
              size="large"
            >
              发送
            </Button>
          </Space>
        </div>
      </div>
    </div>
  );
}
