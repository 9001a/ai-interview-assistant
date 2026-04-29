'use client';

import React, { useState } from 'react';
import { Card, Button, Empty, Space, Tag, Typography, Divider, Checkbox, message } from 'antd';
import {
  PlusOutlined,
  FileTextOutlined,
  DeleteOutlined,
  CheckSquareOutlined,
  ReadOutlined,
  TagOutlined,
  CalendarOutlined,
} from '@ant-design/icons';
import { useWorkspaceStore } from '@/stores/workspaceStore';
import { jdApi } from '@/services/api';
import { JDAnalysisModal } from './JDAnalysisModal';
import { WorkspaceJD } from '@/types';

const { Text, Title } = Typography;

export function JDPanel() {
  const { currentWorkspace, addJDToWorkspace, removeJDFromWorkspace, selectedJDs, selectJD, deselectJD } = useWorkspaceStore();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [analyzingJD, setAnalyzingJD] = useState<WorkspaceJD | null>(null);
  const [loading, setLoading] = useState(false);

  const handleAnalyze = async (jdText: string) => {
    setLoading(true);
    try {
      const result = await jdApi.analyze(jdText);

      if (!result.success || !result.data) {
        message.error('JD 分析失败');
        return;
      }

      // Generate title from first line or default
      const title = jdText.split('\n')[0].slice(0, 30) || '未命名 JD';

      addJDToWorkspace(currentWorkspace!.id, {
        title: title + (title.length >= 30 ? '...' : ''),
        originalText: jdText,
        summary: result.data.summary,
        tags: result.data.tags,
      });

      message.success('JD 分析完成');
      setIsModalOpen(false);
    } catch (error) {
      message.error('JD 分析失败，请重试');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleViewDetail = (jd: WorkspaceJD) => {
    setAnalyzingJD(jd);
  };

  const handleDelete = (jdId: string) => {
    if (confirm('确定要删除这个 JD 吗？')) {
      removeJDFromWorkspace(currentWorkspace!.id, jdId);
      message.success('JD 已删除');
    }
  };

  if (!currentWorkspace) return null;

  return (
    <div className="p-6">
      {/* 操作栏 */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <Title level={5} className="!mb-1">JD 管理</Title>
          <Text type="secondary">
            添加多个相似的 JD，综合优化简历
            {selectedJDs.length > 0 && (
              <span className="ml-2 text-[#e1b382]">
                （已选择 {selectedJDs.length} 个 JD）
              </span>
            )}
          </Text>
        </div>
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={() => setIsModalOpen(true)}
          className="bg-[#e1b382] hover:bg-[#d4a375] border-[#e1b382]"
        >
          添加 JD
        </Button>
      </div>

      {currentWorkspace.jdList.length === 0 ? (
        <Card className="text-center py-12 border-dashed border-2 border-[#e1b382]/30">
          <Empty
            image={<FileTextOutlined className="text-5xl text-[#e1b382]" />}
            description={
              <div>
                <Text className="block mb-2">还没有 JD</Text>
                <Text type="secondary">添加 JD 进行分析和简历优化</Text>
              </div>
            }
          >
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => setIsModalOpen(true)}
              className="bg-[#e1b382] hover:bg-[#d4a375] border-[#e1b382]"
            >
              添加第一个 JD
            </Button>
          </Empty>
        </Card>
      ) : (
        <div className="space-y-4">
          {currentWorkspace.jdList.map((jd) => (
            <Card
              key={jd.id}
              className={`hover:shadow-md transition-shadow ${
                selectedJDs.includes(jd.id) ? 'border-[#e1b382] border-2' : ''
              }`}
              actions={[
                <Button
                  key="view"
                  type="text"
                  icon={<ReadOutlined />}
                  onClick={() => handleViewDetail(jd)}
                >
                  查看详情
                </Button>,
                <Button
                  key="delete"
                  type="text"
                  danger
                  icon={<DeleteOutlined />}
                  onClick={() => handleDelete(jd.id)}
                >
                  删除
                </Button>,
              ]}
            >
              <div className="flex items-start gap-4">
                <Checkbox
                  checked={selectedJDs.includes(jd.id)}
                  onChange={(e) => {
                    if (e.target.checked) {
                      selectJD(jd.id);
                    } else {
                      deselectJD(jd.id);
                    }
                  }}
                  className="mt-1"
                />
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <Title level={5} className="!mb-0 !text-base">{jd.title}</Title>
                    {selectedJDs.includes(jd.id) && (
                      <Tag color="success">已选择</Tag>
                    )}
                  </div>

                  <Space wrap className="mb-3">
                    {jd.tags.map((tag, idx) => (
                      <Tag key={idx} color="blue" icon={<TagOutlined />}>
                        {tag}
                      </Tag>
                    ))}
                  </Space>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-600">
                    <div className="flex items-center gap-2">
                      <ReadOutlined className="text-[#e1b382]" />
                      <Text type="secondary" ellipsis>{jd.summary.overview}</Text>
                    </div>
                    <div className="flex items-center gap-2">
                      <CalendarOutlined className="text-[#e1b382]" />
                      <Text type="secondary">
                        添加于 {new Date(jd.createdAt).toLocaleDateString()}
                      </Text>
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      <JDAnalysisModal
        open={isModalOpen}
        onCancel={() => setIsModalOpen(false)}
        onAnalyze={handleAnalyze}
        loading={loading}
      />

      {/* 查看详情弹窗 */}
      {analyzingJD && (
        <JDDetailModal
          jd={analyzingJD}
          open={!!analyzingJD}
          onClose={() => setAnalyzingJD(null)}
        />
      )}
    </div>
  );
}

// JD 详情弹窗
function JDDetailModal({
  jd,
  open,
  onClose,
}: {
  jd: WorkspaceJD;
  open: boolean;
  onClose: () => void;
}) {
  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center ${open ? '' : 'hidden'}`}
    >
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[80vh] overflow-auto">
        <div className="p-6">
          <div className="flex justify-between items-start mb-4">
            <Title level={4} className="!mb-0">{jd.title}</Title>
            <Button onClick={onClose}>关闭</Button>
          </div>

          <Space wrap className="mb-4">
            {jd.tags.map((tag, idx) => (
              <Tag key={idx} color="blue">{tag}</Tag>
            ))}
          </Space>

          <Divider />

          <div className="space-y-4">
            <div>
              <Title level={5}>岗位概述</Title>
              <p className="text-gray-700">{jd.summary.overview}</p>
            </div>

            <div>
              <Title level={5}>隐藏要求</Title>
              <p className="text-gray-700">{jd.summary.hiddenRequirements}</p>
            </div>

            <div>
              <Title level={5}>日常工作</Title>
              <p className="text-gray-700">{jd.summary.dailyWork}</p>
            </div>

            <div>
              <Title level={5}>发展前景</Title>
              <p className="text-gray-700">{jd.summary.prospects}</p>
            </div>

            <Divider />

            <div>
              <Title level={5}>原始 JD</Title>
              <div className="bg-gray-50 p-4 rounded text-sm text-gray-600 whitespace-pre-wrap">
                {jd.originalText}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
