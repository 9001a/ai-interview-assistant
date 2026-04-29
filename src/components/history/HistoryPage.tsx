'use client';

import { useState } from 'react';
import { Card, List, Typography, Tag, Button, Space, Input } from 'antd';
import { HistoryOutlined, SearchOutlined, CalendarOutlined } from '@ant-design/icons';

const { Title, Text } = Typography;

const mockHistory = [
  {
    id: '1',
    title: '字节跳动 - Java后端开发',
    date: '2024-01-15',
    turns: 32,
    score: 85,
    status: 'completed',
  },
  {
    id: '2',
    title: '腾讯 - 前端工程师',
    date: '2024-01-10',
    turns: 18,
    score: 78,
    status: 'completed',
  },
  {
    id: '3',
    title: '阿里巴巴 - 算法工程师',
    date: '2024-01-05',
    turns: 45,
    score: 92,
    status: 'completed',
  },
];

export default function HistoryPage() {
  const [searchText, setSearchText] = useState('');

  const getStatusColor = (status: string) => {
    return status === 'completed' ? 'success' : 'processing';
  };

  const getScoreColor = (score: number) => {
    if (score >= 85) return '#52C41A';
    if (score >= 70) return '#FAAD14';
    return '#FF6B6B';
  };

  return (
    <div style={{ maxWidth: 900, margin: '0 auto' }}>
      <Card style={{ borderRadius: 16 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
          <Title level={4} style={{ margin: 0 }}>
            <HistoryOutlined style={{ marginRight: 8, color: '#F5A623' }} />
            历史记录
          </Title>
          <Input
            placeholder="搜索公司或岗位..."
            prefix={<SearchOutlined />}
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            style={{ width: 280 }}
          />
        </div>

        <List
          itemLayout="horizontal"
          dataSource={mockHistory}
          renderItem={(item) => (
            <List.Item
              actions={[
                <Button type="link" size="small">查看对话</Button>,
                <Button type="link" size="small">继续面试</Button>,
                <Button type="link" size="small" danger>重新面试</Button>,
              ]}
            >
              <List.Item.Meta
                avatar={
                  <div
                    style={{
                      width: 48,
                      height: 48,
                      borderRadius: 12,
                      backgroundColor: '#FFECD2',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: 20,
                    }}
                  >
                    📌
                  </div>
                }
                title={
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <Text strong style={{ fontSize: 16 }}>{item.title}</Text>
                    <Tag color={getStatusColor(item.status)}>
                      {item.status === 'completed' ? '已完成' : '进行中'}
                    </Tag>
                  </div>
                }
                description={
                  <Space>
                    <Text type="secondary">
                      <CalendarOutlined style={{ marginRight: 4 }} />
                      {item.date}
                    </Text>
                    <Text type="secondary">面试轮数: {item.turn}</Text>
                    <Text style={{ color: getScoreColor(item.score), fontWeight: 'bold' }}>
                      评分: {item.score}
                    </Text>
                  </Space>
                }
              />
            </List.Item>
          )}
        />
      </Card>
    </div>
  );
}
