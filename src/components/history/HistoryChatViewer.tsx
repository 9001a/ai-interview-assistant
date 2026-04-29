'use client';

import { useState, useRef, useEffect } from 'react';
import { Button, Space, Avatar, Typography, Card, Divider } from 'antd';
import { ArrowLeftOutlined, UserOutlined, RobotOutlined } from '@ant-design/icons';
import type { ChatMessage, InterviewerConfig, HistoryRecord } from '@/types';
import { usePageStore } from '@/stores/pageStore';

const { Text, Paragraph } = Typography;

interface HistoryChatViewerProps {
  record: HistoryRecord;
}

export default function HistoryChatViewer({ record }: HistoryChatViewerProps) {
  const { setCurrentPage } = usePageStore();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  // 兼容两种情况：标准历史记录和工作区临时记录
  const messages = record.content?.messages || (record as any).messages || [];
  const interviewerConfig = record.content?.interviewerConfig;

  // 自动滚动到底部
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  return (
    <div style={{ padding: '24px', maxWidth: 1000, margin: '0 auto' }}>
      <Card
        styles={{
          header: { backgroundColor: '#FFFBF5', borderBottom: '1px solid #E8DFD0' },
          body: { backgroundColor: '#FFF8E7', padding: 0 },
        }}
        title={
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <Button 
              icon={<ArrowLeftOutlined />} 
              onClick={() => setCurrentPage('history')}
            >
              返回
            </Button>
            <div>
              <Text strong style={{ fontSize: 16, display: 'block', color: '#5C4A32' }}>
                {record.title}
              </Text>
              <Text type="secondary" style={{ fontSize: 12 }}>
                {new Date(record.createdAt).toLocaleString('zh-CN')}
              </Text>
            </div>
          </div>
        }
      >
        <div style={{ 
          display: 'flex', 
          flexDirection: 'column', 
          height: 'calc(100vh - 200px)',
          minHeight: 500,
        }}>
          {/* 消息列表 */}
          <div style={{ 
            flex: 1, 
            overflowY: 'auto', 
            padding: '24px',
            backgroundColor: '#FFFBF5',
          }}>
            {messages.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '48px', color: '#8B7355' }}>
                <div style={{ fontSize: 48, marginBottom: 16 }}>💬</div>
                <Text type="secondary">暂无对话记录</Text>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                {messages.map((msg: ChatMessage, index: number) => (
                  <div
                    key={msg.id || index}
                    style={{
                      display: 'flex',
                      justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start',
                    }}
                  >
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'flex-start',
                        gap: 12,
                        maxWidth: '75%',
                        flexDirection: msg.role === 'user' ? 'row-reverse' : 'row',
                      }}
                    >
                      <Avatar
                        size={36}
                        icon={msg.role === 'user' ? <UserOutlined /> : <RobotOutlined />}
                        style={{
                          backgroundColor: msg.role === 'user' ? '#8B7355' : '#F5A623',
                          flexShrink: 0,
                        }}
                      />
                      <div
                        style={{
                          backgroundColor: msg.role === 'user' ? '#E1B382' : '#FFFFFF',
                          padding: '12px 16px',
                          borderRadius: 12,
                          borderTopLeftRadius: msg.role === 'user' ? 12 : 4,
                          borderTopRightRadius: msg.role === 'user' ? 4 : 12,
                          boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
                        }}
                      >
                        <Paragraph
                          style={{
                            margin: 0,
                            whiteSpace: 'pre-wrap',
                            wordBreak: 'break-word',
                            color: msg.role === 'user' ? '#FFFFFF' : '#5C4A32',
                          }}
                        >
                          {msg.content}
                        </Paragraph>
                        <Text
                          type="secondary"
                          style={{
                            fontSize: 11,
                            marginTop: 8,
                            display: 'block',
                            opacity: 0.7,
                            color: msg.role === 'user' ? 'rgba(255,255,255,0.8)' : undefined,
                          }}
                        >
                          {new Date(msg.createdAt).toLocaleTimeString('zh-CN')}
                        </Text>
                      </div>
                    </div>
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>
            )}
          </div>
        </div>
      </Card>
    </div>
  );
}
