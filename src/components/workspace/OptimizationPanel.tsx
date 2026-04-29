'use client';

import React, { useState } from 'react';
import { Card, Empty, Space, Tag, Typography, Button, Timeline, Modal } from 'antd';
import {
  HistoryOutlined,
  CheckCircleOutlined,
  FileTextOutlined,
  RobotOutlined,
  CalendarOutlined,
  EyeOutlined,
  DownloadOutlined,
} from '@ant-design/icons';
import { useWorkspaceStore } from '@/stores/workspaceStore';
import { WorkspaceOptimization } from '@/types';

const { Text, Title, Paragraph } = Typography;

export function OptimizationPanel() {
  const { currentWorkspace } = useWorkspaceStore();
  const [selectedOptimization, setSelectedOptimization] = useState<WorkspaceOptimization | null>(null);

  if (!currentWorkspace || currentWorkspace.optimizations.length === 0) {
    return (
      <div className="p-6">
        <Card className="text-center py-12 border-dashed border-2 border-[#e1b382]/30">
          <Empty
            image={<HistoryOutlined className="text-5xl text-[#e1b382]" />}
            description={
              <div>
                <Text className="block mb-2">还没有优化记录</Text>
                <Text type="secondary">在「简历管理」中进行简历优化</Text>
              </div>
            }
          />
        </Card>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <Title level={5} className="!mb-1">优化历史</Title>
        <Text type="secondary">共 {currentWorkspace.optimizations.length} 条优化记录</Text>
      </div>

      <Timeline
        mode="start"
        items={currentWorkspace.optimizations.map((opt) => {
          const resume = currentWorkspace.resumes.find((r) => r.id === opt.resumeId);
          const jds = currentWorkspace.jdList.filter((jd) => opt.jdIds.includes(jd.id));

          return {
            color: '#e1b382',
            title: (
              <Text type="secondary" className="text-xs">
                {new Date(opt.createdAt).toLocaleString()}
              </Text>
            ),
            content: (
              <Card
                size="small"
                className="mb-4 hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <FileTextOutlined className="text-[#e1b382]" />
                      <Text strong>{resume?.title || '未知简历'}</Text>
                      <Tag color="success">评分 {opt.score}</Tag>
                    </div>

                    <div className="mb-2">
                      <Text type="secondary" className="text-sm">参考 JD：</Text>
                      <div className="mt-1">
                        {jds.map((jd) => (
                          <Tag key={jd.id} className="text-xs" color="blue">{jd.title}</Tag>
                        ))}
                      </div>
                    </div>

                    <div className="flex items-center gap-4 text-xs text-gray-500">
                      <span><CalendarOutlined /> {new Date(opt.createdAt).toLocaleDateString()}</span>
                      <span><CheckCircleOutlined /> {opt.highlights.length} 项优化</span>
                    </div>
                  </div>

                  <Space>
                    <Button
                      type="text"
                      icon={<EyeOutlined />}
                      onClick={() => setSelectedOptimization(opt)}
                    >
                      查看
                    </Button>
                    <Button
                      type="text"
                      icon={<DownloadOutlined />}
                      onClick={() => {
                        const blob = new Blob([opt.optimizedContent], { type: 'text/plain' });
                        const url = URL.createObjectURL(blob);
                        const a = document.createElement('a');
                        a.href = url;
                        a.download = `优化简历_${resume?.title || 'resume'}.txt`;
                        a.click();
                      }}
                    >
                      下载
                    </Button>
                  </Space>
                </div>
              </Card>
            ),
          };
        })}
      />

      {/* 详情弹窗 */}
      <Modal
        title="优化详情"
        open={!!selectedOptimization}
        onCancel={() => setSelectedOptimization(null)}
        width={800}
        footer={[
          <Button key="close" onClick={() => setSelectedOptimization(null)}>
            关闭
          </Button>,
        ]}
      >
        {selectedOptimization && (
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 bg-[#fef9f3] rounded">
              <div>
                <Text strong>优化评分：</Text>
                <Text className="text-2xl text-[#e1b382]">{selectedOptimization.score}</Text>
              </div>
              <Text type="secondary">
                {new Date(selectedOptimization.createdAt).toLocaleString()}
              </Text>
            </div>

            <div>
              <Title level={5}>优化亮点</Title>
              <div className="space-y-2">
                {selectedOptimization.highlights.map((highlight, idx) => (
                  <div key={idx} className="flex items-start gap-2">
                    <CheckCircleOutlined className="text-[#e1b382] mt-1" />
                    <Text>{highlight}</Text>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <Title level={5}>优化后简历</Title>
              <div className="bg-gray-50 p-4 rounded max-h-[400px] overflow-auto">
                <pre className="whitespace-pre-wrap text-sm">{selectedOptimization.optimizedContent}</pre>
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
