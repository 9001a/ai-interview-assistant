'use client';

import React, { useState } from 'react';
import { Layout, Row, Col, Card, Typography, Button, Space, Empty, Tag, Badge, Tabs, message } from 'antd';
import {
  PlusOutlined,
  FolderOutlined,
  FileTextOutlined,
  RobotOutlined,
  PlayCircleOutlined,
  DeleteOutlined,
  ArrowLeftOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  SyncOutlined,
  MessageOutlined,
} from '@ant-design/icons';
import { useWorkspaceStore } from '@/stores/workspaceStore';
import { useAuthStore } from '@/stores/authStore';
import { Workspace, WorkspaceType, WorkspaceJD, WorkspaceResume } from '@/types';
import { CreateWorkspaceModal } from './CreateWorkspaceModal';
import { JDPanel } from './JDPanel';
import { ResumePanel } from './ResumePanel';
import { OptimizationPanel } from './OptimizationPanel';
import InterviewPanel from './InterviewPanel';

const { Title, Text } = Typography;

const workspaceTypeLabels: Record<WorkspaceType, { label: string; color: string }> = {
  backend: { label: '后端开发', color: 'blue' },
  frontend: { label: '前端开发', color: 'green' },
  algorithm: { label: '算法', color: 'purple' },
  product: { label: '产品经理', color: 'orange' },
  custom: { label: '自定义', color: 'default' },
};

const workspaceStatusLabels: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  idle: { label: '准备中', color: 'default', icon: <ClockCircleOutlined /> },
  analyzing: { label: '分析中', color: 'processing', icon: <SyncOutlined spin /> },
  optimizing: { label: '优化中', color: 'warning', icon: <SyncOutlined spin /> },
  interviewing: { label: '面试中', color: 'success', icon: <PlayCircleOutlined /> },
  completed: { label: '已完成', color: 'success', icon: <CheckCircleOutlined /> },
};

export default function WorkspacePage() {
  const { user } = useAuthStore();
  const {
    workspaces,
    currentWorkspace,
    setCurrentWorkspace,
    deleteWorkspace,
  } = useWorkspaceStore();

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  const handleCreateWorkspace = (name: string, type: WorkspaceType) => {
    setIsCreateModalOpen(false);
    message.success('工作区创建成功');
  };

  const handleDeleteWorkspace = (e: React.MouseEvent, workspace: Workspace) => {
    e.stopPropagation();
    if (confirm(`确定要删除工作区 "${workspace.name}" 吗？`)) {
      deleteWorkspace(workspace.id);
      message.success('工作区已删除');
    }
  };

  // 工作区列表视图
  if (!currentWorkspace) {
    return (
      <div className="p-6">
        <div className="mb-6 flex justify-between items-center">
          <div>
            <Title level={4} className="!mb-1">我的工作区</Title>
            <Text type="secondary">为不同的求职方向创建独立的工作空间</Text>
          </div>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => setIsCreateModalOpen(true)}
            className="bg-[#e1b382] hover:bg-[#d4a375] border-[#e1b382]"
          >
            新建工作区
          </Button>
        </div>

        {workspaces.length === 0 ? (
          <Card className="text-center py-16 border-dashed border-2 border-[#e1b382]/30">
            <Empty
              image={<FolderOutlined className="text-6xl text-[#e1b382]" />}
              description={
                <div>
                  <Text className="text-lg mb-2 block">还没有工作区</Text>
                  <Text type="secondary">创建工作区来管理 JD、简历和面试</Text>
                </div>
              }
            >
              <Button
                type="primary"
                icon={<PlusOutlined />}
                onClick={() => setIsCreateModalOpen(true)}
                className="bg-[#e1b382] hover:bg-[#d4a375] border-[#e1b382]"
              >
                创建第一个工作区
              </Button>
            </Empty>
          </Card>
        ) : (
          <Row gutter={[16, 16]}>
            {workspaces.map((workspace) => {
              const typeInfo = workspaceTypeLabels[workspace.type];
              const statusInfo = workspaceStatusLabels[workspace.status];

              return (
                <Col xs={24} sm={12} lg={8} key={workspace.id}>
                  <Card
                    hoverable
                    className="group cursor-pointer border-[#c4b7a6] hover:border-[#e1b382] transition-all"
                    onClick={() => setCurrentWorkspace(workspace)}
                    title={
                      <div className="flex justify-between items-start">
                        <div>
                          <Title level={5} className="!mb-0 !text-base">{workspace.name}</Title>
                          <Tag color={typeInfo.color} className="mt-2">{typeInfo.label}</Tag>
                        </div>
                        <Badge
                          status={statusInfo.color as any}
                          text={
                            <Space>
                              {statusInfo.icon}
                              <span className="text-xs">{statusInfo.label}</span>
                            </Space>
                          }
                        />
                      </div>
                    }
                    actions={[
                      <Button
                        key="delete"
                        type="text"
                        danger
                        icon={<DeleteOutlined />}
                        onClick={(e) => handleDeleteWorkspace(e, workspace)}
                      >
                        删除
                      </Button>,
                    ]}
                  >
                    <div className="space-y-2">
                      <div className="flex items-center text-gray-600">
                        <FileTextOutlined className="mr-2 text-[#e1b382]" />
                        <Text type="secondary">{workspace.jdList.length} 个 JD</Text>
                      </div>
                      <div className="flex items-center text-gray-600">
                        <RobotOutlined className="mr-2 text-[#e1b382]" />
                        <Text type="secondary">{workspace.resumes.length} 份简历</Text>
                      </div>
                      <div className="flex items-center text-gray-600">
                        <CheckCircleOutlined className="mr-2 text-[#e1b382]" />
                        <Text type="secondary">{workspace.optimizations.length} 次优化</Text>
                      </div>
                      <div className="flex items-center text-gray-600">
                        <MessageOutlined className="mr-2 text-[#e1b382]" />
                        <Text type="secondary">{workspace.interviews.length} 次面试</Text>
                      </div>
                    </div>
                  </Card>
                </Col>
              );
            })}
          </Row>
        )}

        <CreateWorkspaceModal
          open={isCreateModalOpen}
          onCancel={() => setIsCreateModalOpen(false)}
          onCreate={handleCreateWorkspace}
        />
      </div>
    );
  }

  // 工作区详情视图
  const tabItems = [
    {
      key: 'jd',
      label: (
        <span>
          <FileTextOutlined /> JD 管理 ({currentWorkspace.jdList.length})
        </span>
      ),
      children: <JDPanel />,
    },
    {
      key: 'resume',
      label: (
        <span>
          <RobotOutlined /> 简历管理 ({currentWorkspace.resumes.length})
        </span>
      ),
      children: <ResumePanel />,
    },
    {
      key: 'optimization',
      label: (
        <span>
          <SyncOutlined /> 优化记录 ({currentWorkspace.optimizations.length})
        </span>
      ),
      children: <OptimizationPanel />,
    },
    {
      key: 'interview',
      label: (
        <span>
          <MessageOutlined /> 面试记录 ({currentWorkspace.interviews.length})
        </span>
      ),
      children: <InterviewPanel />,
    },
  ];

  return (
    <div className="h-full flex flex-col">
      {/* 顶部导航 */}
      <div className="px-6 py-4 border-b border-[#e1b382]/20 bg-gradient-to-r from-[#fef9f3] to-[#fff]">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              icon={<ArrowLeftOutlined />}
              onClick={() => setCurrentWorkspace(null)}
              className="border-[#e1b382] text-[#c4b7a6] hover:text-[#e1b382] hover:border-[#e1b382]"
            >
              返回
            </Button>
            <div>
              <Title level={4} className="!mb-0 flex items-center gap-2">
                {currentWorkspace.name}
                <Tag color={workspaceTypeLabels[currentWorkspace.type].color}>
                  {workspaceTypeLabels[currentWorkspace.type].label}
                </Tag>
              </Title>
              <Text type="secondary">
                创建于 {new Date(currentWorkspace.createdAt).toLocaleDateString()}
              </Text>
            </div>
          </div>
          <Space>
            <Button
              danger
              icon={<DeleteOutlined />}
              onClick={() => {
                if (confirm(`确定要删除工作区 "${currentWorkspace.name}" 吗？`)) {
                  deleteWorkspace(currentWorkspace.id);
                  message.success('工作区已删除');
                }
              }}
            >
              删除工作区
            </Button>
          </Space>
        </div>
      </div>

      {/* Tab 内容 */}
      <div className="flex-1 overflow-auto">
        <Tabs
          defaultActiveKey="jd"
          className="workspace-tabs px-6"
          tabBarStyle={{ marginBottom: 0 }}
          items={tabItems}
        />
      </div>
    </div>
  );
}
