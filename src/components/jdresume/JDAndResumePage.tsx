'use client';

import { Card, Tabs, List, Button, Empty, Tag, Typography, Space, Popconfirm, Modal, Input, Descriptions } from 'antd';
import { DeleteOutlined, FileTextOutlined, ReloadOutlined, EyeOutlined, EditOutlined } from '@ant-design/icons';
import { useJDStore } from '@/stores/jdStore';
import { useResumeStore } from '@/stores/resumeStore';
import { useState, useEffect } from 'react';
import { JDAnalysis, Resume } from '@/types';

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
  const { jdList, deleteJD, updateJD } = useJDStore();
  const { resumes, deleteResume, updateResume } = useResumeStore();
  const [activeTab, setActiveTab] = useState('jd');
  const [mounted, setMounted] = useState(false);

  // 查看/编辑状态
  const [viewingJD, setViewingJD] = useState<JDAnalysis | null>(null);
  const [viewingResume, setViewingResume] = useState<Resume | null>(null);
  const [editingJD, setEditingJD] = useState<JDAnalysis | null>(null);
  const [editingResume, setEditingResume] = useState<Resume | null>(null);
  const [editName, setEditName] = useState('');

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleDeleteJD = (id: string) => {
    deleteJD(id);
  };

  const handleDeleteResume = (id: string) => {
    deleteResume(id);
  };

  const handleRefresh = () => {
    window.location.reload();
  };

  // 打开查看 JD 详情
  const handleViewJD = (jd: JDAnalysis) => {
    setViewingJD(jd);
  };

  // 打开编辑 JD 名称
  const handleEditJD = (jd: JDAnalysis) => {
    setEditingJD(jd);
    setEditName(jd.title || `JD - ${formatDateTime(jd.createdAt)}`);
  };

  // 保存 JD 名称
  const handleSaveJDName = () => {
    if (editingJD && editingJD.id) {
      updateJD(editingJD.id, { title: editName });
      setEditingJD(null);
    }
  };

  // 打开查看简历详情
  const handleViewResume = (resume: Resume) => {
    setViewingResume(resume);
  };

  // 打开编辑简历名称
  const handleEditResume = (resume: Resume) => {
    setEditingResume(resume);
    setEditName(resume.title);
  };

  // 保存简历名称
  const handleSaveResumeName = () => {
    if (editingResume && editingResume.id) {
      updateResume(editingResume.id, { title: editName });
      setEditingResume(null);
    }
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
                          <Button
                            key="view"
                            type="text"
                            icon={<EyeOutlined />}
                            onClick={() => handleViewJD(jd)}
                          >
                            查看
                          </Button>,
                          <Button
                            key="edit"
                            type="text"
                            icon={<EditOutlined />}
                            onClick={() => handleEditJD(jd)}
                          >
                            编辑
                          </Button>,
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
                              <span>{jd.title || `JD - ${formatDateTime(jd.createdAt)}`}</span>
                            </Space>
                          }
                          description={
                            <Space orientation="vertical" className="w-full mt-2">
                              <Text type="secondary" className="text-xs">
                                上传时间: {formatDateTime(jd.createdAt)}
                              </Text>
                              {jd.tags && jd.tags.length > 0 && (
                                <div className="flex flex-wrap gap-1">
                                  {jd.tags.slice(0, 3).map((tag, idx) => (
                                    <Tag key={idx} color="blue">{tag}</Tag>
                                  ))}
                                  {jd.tags.length > 3 && <Tag>+{jd.tags.length - 3}</Tag>}
                                </div>
                              )}
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
                          <Button
                            key="view"
                            type="text"
                            icon={<EyeOutlined />}
                            onClick={() => handleViewResume(resume)}
                          >
                            查看
                          </Button>,
                          <Button
                            key="edit"
                            type="text"
                            icon={<EditOutlined />}
                            onClick={() => handleEditResume(resume)}
                          >
                            编辑
                          </Button>,
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
                              <Text type="secondary" className="text-xs">
                                文件类型: {resume.fileType.toUpperCase()}
                              </Text>
                              {resume.optimizations && resume.optimizations.length > 0 && (
                                <Tag color="green">已优化 {resume.optimizations.length} 次</Tag>
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
        ]}
      />

      {/* 查看 JD 详情 Modal */}
      <Modal
        title="JD 详情"
        open={!!viewingJD}
        onCancel={() => setViewingJD(null)}
        footer={[
          <Button key="close" onClick={() => setViewingJD(null)}>
            关闭
          </Button>,
        ]}
        width={800}
      >
        {viewingJD && (
          <Descriptions bordered column={1}>
            <Descriptions.Item label="名称">
              {viewingJD.title || `JD - ${formatDateTime(viewingJD.createdAt)}`}
            </Descriptions.Item>
            <Descriptions.Item label="创建时间">
              {formatDateTime(viewingJD.createdAt)}
            </Descriptions.Item>
            <Descriptions.Item label="技能标签">
              <Space wrap>
                {viewingJD.tags?.map((tag, idx) => (
                  <Tag key={idx} color="blue">{tag}</Tag>
                ))}
              </Space>
            </Descriptions.Item>
            <Descriptions.Item label="岗位概述">
              {viewingJD.summary?.overview}
            </Descriptions.Item>
            <Descriptions.Item label="隐含要求">
              {viewingJD.summary?.hiddenRequirements}
            </Descriptions.Item>
            <Descriptions.Item label="日常工作">
              {viewingJD.summary?.dailyWork}
            </Descriptions.Item>
            <Descriptions.Item label="发展前景">
              {viewingJD.summary?.prospects}
            </Descriptions.Item>
            <Descriptions.Item label="原始文本">
              <div style={{ maxHeight: 200, overflow: 'auto', background: '#f5f5f5', padding: 8 }}>
                <Text style={{ whiteSpace: 'pre-wrap', fontSize: 12 }}>
                  {viewingJD.originalText}
                </Text>
              </div>
            </Descriptions.Item>
          </Descriptions>
        )}
      </Modal>

      {/* 编辑 JD 名称 Modal */}
      <Modal
        title="编辑 JD 名称"
        open={!!editingJD}
        onCancel={() => setEditingJD(null)}
        onOk={handleSaveJDName}
      >
        <Input
          value={editName}
          onChange={(e) => setEditName(e.target.value)}
          placeholder="请输入 JD 名称"
        />
      </Modal>

      {/* 查看简历详情 Modal */}
      <Modal
        title="简历详情"
        open={!!viewingResume}
        onCancel={() => setViewingResume(null)}
        footer={[
          <Button key="close" onClick={() => setViewingResume(null)}>
            关闭
          </Button>,
        ]}
        width={800}
      >
        {viewingResume && (
          <>
            <Descriptions bordered column={1}>
              <Descriptions.Item label="名称">{viewingResume.title}</Descriptions.Item>
              <Descriptions.Item label="创建时间">
                {formatDateTime(viewingResume.createdAt)}
              </Descriptions.Item>
              <Descriptions.Item label="文件类型">
                {viewingResume.fileType.toUpperCase()}
              </Descriptions.Item>
              <Descriptions.Item label="内容摘要">
                <div style={{ maxHeight: 300, overflow: 'auto', background: '#f5f5f5', padding: 8 }}>
                  <Text style={{ whiteSpace: 'pre-wrap', fontSize: 12 }}>
                    {viewingResume.content}
                  </Text>
                </div>
              </Descriptions.Item>
            </Descriptions>
            
            {/* 优化记录 */}
            {viewingResume.optimizations && viewingResume.optimizations.length > 0 && (
              <div style={{ marginTop: 24 }}>
                <Title level={5}>优化记录 ({viewingResume.optimizations.length})</Title>
                {viewingResume.optimizations.map((opt, idx) => (
                  <Card
                    key={opt.id}
                    size="small"
                    title={`优化 #${viewingResume.optimizations!.length - idx} - ${formatDateTime(opt.createdAt)}`}
                    style={{ marginBottom: 16 }}
                  >
                    <Descriptions bordered column={1} size="small">
                      <Descriptions.Item label="匹配度评分">
                        <Tag color={opt.score >= 80 ? 'green' : opt.score >= 60 ? 'orange' : 'red'}>
                          {opt.score} 分
                        </Tag>
                      </Descriptions.Item>
                      {opt.jdTitle && (
                        <Descriptions.Item label="针对JD">{opt.jdTitle}</Descriptions.Item>
                      )}
                      <Descriptions.Item label="优化亮点">
                        <ul style={{ margin: 0, paddingLeft: 16 }}>
                          {opt.highlights.map((highlight, hIdx) => (
                            <li key={hIdx}>{highlight}</li>
                          ))}
                        </ul>
                      </Descriptions.Item>
                      <Descriptions.Item label="优化后内容">
                        <div style={{ maxHeight: 200, overflow: 'auto', background: '#f5f5f5', padding: 8 }}>
                          <Text style={{ whiteSpace: 'pre-wrap', fontSize: 12 }}>
                            {opt.content}
                          </Text>
                        </div>
                      </Descriptions.Item>
                    </Descriptions>
                  </Card>
                ))}
              </div>
            )}
          </>
        )}
      </Modal>

      {/* 编辑简历名称 Modal */}
      <Modal
        title="编辑简历名称"
        open={!!editingResume}
        onCancel={() => setEditingResume(null)}
        onOk={handleSaveResumeName}
      >
        <Input
          value={editName}
          onChange={(e) => setEditName(e.target.value)}
          placeholder="请输入简历名称"
        />
      </Modal>
    </div>
  );
}
