'use client';

import { Card, Tabs, List, Button, Empty, Tag, Typography, Space, Popconfirm, Badge } from 'antd';
import { DeleteOutlined, FileTextOutlined, ReloadOutlined } from '@ant-design/icons';
import { useJDStore } from '@/stores/jdStore';
import { useResumeStore } from '@/stores/resumeStore';
import { useState, useEffect } from 'react';

const { Title, Text } = Typography;

// 格式化日期时间
const formatDateTime = (dateStr: string) => {
  const date = new Date(dateStr);
  return date.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
};

export default function JDAndResumePage() {
  const { jdList, deleteJD } = useJDStore();
  const { resumes, deleteResume } = useResumeStore();
  const [activeTab, setActiveTab] = useState('jd');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    console.log('📋 JDAndResumePage 加载，当前 JD 数量:', jdList.length);
    console.log('📋 当前简历数量:', resumes.length);
  }, [jdList.length, resumes.length]);

  const handleDeleteJD = (id: string) => {
    deleteJD(id);
  };

  const handleDeleteResume = (id: string) => {
    deleteResume(id);
  };

  const handleRefresh = () => {
    window.location.reload();
  };

  // 避免 hydration 不匹配
  if (!mounted) {
    return (
      <div className="p-6 max-w-6xl mx-auto">
        <Title level={2}>JD 和简历管理</Title>
        <Text type="secondary">加载中...</Text>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="flex justify-between items-center mb-4">
        <div>
          <Title level={2}>JD 和简历管理</Title>
          <Text type="secondary">
            统一管理您上传的所有 JD 和简历，可在面试时快速选择使用
          </Text>
        </div>
        <Button icon={<ReloadOutlined />} onClick={handleRefresh}>
          刷新
        </Button>
      </div>

      <Tabs
        activeKey={activeTab}
        onChange={setActiveTab}
        items={[
          {
            key: 'jd',
            label: `职位描述 (${jdList.length})`,
            children: (
              <Card>
                {jdList.length === 0 ? (
                  <Empty
                    description="暂无 JD"
                    image={Empty.PRESENTED_IMAGE_SIMPLE}
                  />
                ) : (
                  <List
                    dataSource={jdList}
                    renderItem={(jd) => (
                      <List.Item
                        key={jd.id}
                        actions={[
                          <Popconfirm
                            key="delete"
                            title="确定要删除这个 JD 吗？"
                            onConfirm={() => jd.id && handleDeleteJD(jd.id)}
                          >
                            <Button
                              type="text"
                              danger
                              icon={<DeleteOutlined />}
                            >
                              删除
                            </Button>
                          </Popconfirm>,
                        ]}
                      >
                        <List.Item.Meta
                          title={
                            <Space>
                              <FileTextOutlined />
                              <span>JD - {formatDateTime(jd.createdAt)}</span>
                            </Space>
                          }
                          description={
                            <Space orientation="vertical" className="w-full mt-2">
                              <Text type="secondary" className="text-xs">
                                上传时间: {formatDateTime(jd.createdAt)}
                              </Text>
                              {jd.summary?.overview && (
                                <Text ellipsis className="max-w-2xl">
                                  {jd.summary.overview.slice(0, 100)}...
                                </Text>
                              )}
                            </Space>
                          }
                        />
                      </List.Item>
                    )}
                  />
                )}
              </Card>
            ),
          },
          {
            key: 'resume',
            label: `简历 (${resumes.length})`,
            children: (
              <Card>
                {resumes.length === 0 ? (
                  <Empty
                    description="暂无简历"
                    image={Empty.PRESENTED_IMAGE_SIMPLE}
                  />
                ) : (
                  <List
                    dataSource={resumes}
                    renderItem={(resume) => (
                      <List.Item
                        key={resume.id}
                        actions={[
                          <Popconfirm
                            key="delete"
                            title="确定要删除这份简历吗？"
                            onConfirm={() => resume.id && handleDeleteResume(resume.id)}
                          >
                            <Button
                              type="text"
                              danger
                              icon={<DeleteOutlined />}
                            >
                              删除
                            </Button>
                          </Popconfirm>,
                        ]}
                      >
                        <List.Item.Meta
                          title={
                            <Space>
                              <span>{resume.title}</span>
                            </Space>
                          }
                          description={
                            <Space orientation="vertical" className="w-full mt-2">
                              <Text type="secondary" className="text-xs">
                                上传时间: {formatDateTime(resume.createdAt)}
                              </Text>
                            </Space>
                          }
                        />
                      </List.Item>
                    )}
                  />
                )}
              </Card>
            ),
          },
        ]}
      />
    </div>
  );
}
