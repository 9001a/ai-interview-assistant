'use client';

import { useState } from 'react';
import { Card, Button, Typography, Space, Divider, Badge } from 'antd';
import { MessageOutlined, PlayCircleOutlined, PauseCircleOutlined, SettingOutlined } from '@ant-design/icons';

const { Title, Text } = Typography;

export default function InterviewPage() {
  const [started, setStarted] = useState(false);
  const [turnCount, setTurnCount] = useState(0);

  const handleStart = () => {
    setStarted(true);
    setTurnCount(0);
  };

  const handleEnd = () => {
    setStarted(false);
  };

  return (
    <div style={{ maxWidth: 1000, margin: '0 auto' }}>
      <Card style={{ borderRadius: 16 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
          <Title level={4} style={{ margin: 0 }}>
            <MessageOutlined style={{ marginRight: 8, color: '#F5A623' }} />
            AI 模拟面试
          </Title>
          <Space>
            {started && (
              <>
                <Badge status="processing" text={`第 ${turnCount + 1}/30 轮`} />
                <Button icon={<SettingOutlined />}>配置</Button>
                <Button icon={<PauseCircleOutlined />} danger onClick={handleEnd}>
                  结束面试
                </Button>
              </>
            )}
          </Space>
        </div>

        {!started ? (
          <div style={{ textAlign: 'center', padding: '60px 24px' }}>
            <Title level={3} style={{ marginBottom: 16 }}>
              ☀️ 准备好面试了吗？
            </Title>
            <Text type="secondary" style={{ fontSize: 16, display: 'block', marginBottom: 32 }}>
              请先完成 JD 分析和简历上传，让我更好地准备面试问题
            </Text>
            <Space size="large">
              <Button type="primary" size="large" icon={<PlayCircleOutlined />} onClick={handleStart} style={{ height: 48, minWidth: 180, fontSize: 16 }}>
                开始面试
              </Button>
            </Space>
          </div>
        ) : (
          <div>
            <div style={{ minHeight: 400, border: '1px solid #E8DFD0', borderRadius: 12, padding: 24, backgroundColor: '#FFF8E7' }}>
              <div style={{ textAlign: 'center', padding: '40px 0' }}>
                <Text type="secondary" style={{ fontSize: 16 }}>
                  面试中...对话区域
                </Text>
              </div>
            </div>
            <Divider />
            <div style={{ display: 'flex', gap: 12 }}>
              <div style={{ flex: 1, border: '1px solid #E8DFD0', borderRadius: 12, padding: 16, backgroundColor: '#FFF8E7' }}>
                <Text type="secondary">请输入你的回答...</Text>
              </div>
              <Button type="primary" size="large">
                发送
              </Button>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}
