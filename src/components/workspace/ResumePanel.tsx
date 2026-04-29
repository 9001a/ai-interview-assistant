'use client';

import React, { useState, useRef } from 'react';
import { Card, Button, Empty, Space, Tag, Typography, Upload, message, Modal, Input, Progress } from 'antd';
import {
  PlusOutlined,
  FileTextOutlined,
  DeleteOutlined,
  FilePdfOutlined,
  FileWordOutlined,
  CheckCircleOutlined,
  EditOutlined,
  RobotOutlined,
  LoadingOutlined,
  InboxOutlined,
  ExclamationCircleOutlined,
} from '@ant-design/icons';
import { useWorkspaceStore } from '@/stores/workspaceStore';
import { useResumeStore } from '@/stores/resumeStore';
import { resumeApi } from '@/services/api';
import { WorkspaceResume, Resume } from '@/types';

const { Text, Title, Paragraph } = Typography;
const { Dragger } = Upload;
const { TextArea } = Input;

export function ResumePanel() {
  const { currentWorkspace, addResumeToWorkspace, removeResumeFromWorkspace, selectResume, selectedResume, getSelectedJDs, addOptimization } = useWorkspaceStore();
  const { addResume } = useResumeStore();
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [isOptimizeModalOpen, setIsOptimizeModalOpen] = useState(false);
  const [isResultModalOpen, setIsResultModalOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [optimizing, setOptimizing] = useState(false);
  const [optimizationResult, setOptimizationResult] = useState<{
    content: string;
    highlights: string[];
    score: number;
  } | null>(null);
  const [resumeTitle, setResumeTitle] = useState('');
  const [fileContent, setFileContent] = useState('');

  const selectedJDs = getSelectedJDs();

  const handleFileUpload = async (file: File) => {
    setUploading(true);
    try {
      const result = await resumeApi.parse(file);

      if (!result.success || !result.data) {
        message.error(result.error || '简历解析失败');
        return false;
      }

      setFileContent(result.data.content);
      setResumeTitle(file.name.replace(/\.[^/.]+$/, ''));
      setIsUploadModalOpen(false);
      message.success('简历解析成功，请完善信息');
    } catch (error: any) {
      message.error(error.response?.data?.error || '上传失败，请重试');
    } finally {
      setUploading(false);
    }
    return false;
  };

  const handleSaveResume = () => {
    if (!resumeTitle.trim() || !fileContent.trim()) {
      message.error('请填写简历标题');
      return;
    }

    // 添加到工作区
    addResumeToWorkspace(currentWorkspace!.id, {
      title: resumeTitle,
      content: fileContent,
      summary: fileContent.slice(0, 100) + '...',
      fileType: 'pdf',
    });

    // 同时添加到全局简历 Store
    const resume: Resume = {
      id: Date.now().toString(),
      userId: currentWorkspace!.userId,
      title: resumeTitle,
      content: fileContent,
      summary: fileContent.slice(0, 100) + '...',
      fileType: 'pdf',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    addResume(resume);

    setResumeTitle('');
    setFileContent('');
    message.success('简历添加成功，已保存到简历库');
  };

  const handleOptimize = async () => {
    if (!selectedResume || selectedJDs.length === 0) {
      message.warning('请先选择简历和至少一个 JD');
      return;
    }

    setOptimizing(true);
    try {
      const result = await resumeApi.optimize({
        resumeContent: selectedResume.content,
        jdTexts: selectedJDs.map(jd => jd.originalText),
      });

      if (!result.success || !result.data) {
        message.error('优化失败');
        return;
      }

      setOptimizationResult(result.data);

      // Save optimization record
      addOptimization(currentWorkspace!.id, {
        resumeId: selectedResume.id,
        jdIds: selectedJDs.map(jd => jd.id),
        optimizedContent: result.data.content,
        highlights: result.data.highlights,
        score: result.data.score,
      });

      message.success('简历优化完成');
    } catch (error: any) {
      message.error(error.response?.data?.error || '优化失败，请重试');
    } finally {
      setOptimizing(false);
    }
  };

  const handleDelete = (resumeId: string) => {
    if (confirm('确定要删除这份简历吗？')) {
      removeResumeFromWorkspace(currentWorkspace!.id, resumeId);
      message.success('简历已删除');
    }
  };

  if (!currentWorkspace) return null;

  return (
    <div className="p-6">
      {/* 优化控制栏 */}
      <Card className="mb-6 bg-gradient-to-r from-[#fef9f3] to-white border-[#e1b382]/30">
        <div className="flex items-center justify-between">
          <div>
            <Title level={5} className="!mb-1 flex items-center gap-2">
              <RobotOutlined className="text-[#e1b382]" />
              AI 简历优化
            </Title>
            <Text type="secondary">
              {selectedResume
                ? `已选择简历: ${selectedResume.title}`
                : '请选择一份简历'}
              {selectedJDs.length > 0
                ? ` | 基于 ${selectedJDs.length} 个 JD 优化`
                : ' | 请先选择 JD'}
            </Text>
          </div>
          <Button
            type="primary"
            size="large"
            icon={optimizing ? <LoadingOutlined /> : <RobotOutlined />}
            onClick={() => setIsOptimizeModalOpen(true)}
            disabled={!selectedResume || selectedJDs.length === 0}
            loading={optimizing}
            className="bg-[#e1b382] hover:bg-[#d4a375] border-[#e1b382]"
          >
            {optimizing ? '优化中...' : '开始优化'}
          </Button>
        </div>

        {selectedJDs.length === 0 && (
          <div className="mt-4 p-3 bg-yellow-50 rounded text-yellow-700 text-sm">
            提示：请先到「JD 管理」标签页选择要优化的目标 JD
          </div>
        )}
      </Card>

      {/* 简历列表 */}
      <div className="flex justify-between items-center mb-4">
        <Title level={5} className="!mb-0">我的简历</Title>
        <Button
          icon={<PlusOutlined />}
          onClick={() => setIsUploadModalOpen(true)}
          className="border-[#e1b382] text-[#c4b7a6] hover:text-[#e1b382] hover:border-[#e1b382]"
        >
          添加简历
        </Button>
      </div>

      {currentWorkspace.resumes.length === 0 ? (
        <Card className="text-center py-12 border-dashed border-2 border-[#e1b382]/30">
          <Empty
            image={<FileTextOutlined className="text-5xl text-[#e1b382]" />}
            description={
              <div>
                <Text className="block mb-2">还没有简历</Text>
                <Text type="secondary">上传简历进行 AI 优化</Text>
              </div>
            }
          >
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => setIsUploadModalOpen(true)}
              className="bg-[#e1b382] hover:bg-[#d4a375] border-[#e1b382]"
            >
              添加简历
            </Button>
          </Empty>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {currentWorkspace.resumes.map((resume) => (
            <Card
              key={resume.id}
              className={`cursor-pointer transition-all ${
                selectedResume?.id === resume.id
                  ? 'border-[#e1b382] border-2 shadow-md'
                  : 'hover:shadow-md'
              }`}
              onClick={() => selectResume(resume)}
            >
              <div className="flex items-start gap-3">
                <div className="text-3xl text-[#e1b382]">
                  {resume.fileType === 'pdf' ? <FilePdfOutlined /> : <FileWordOutlined />}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <Title level={5} className="!mb-0 !text-base truncate">{resume.title}</Title>
                    {selectedResume?.id === resume.id && (
                      <Tag color="success">已选择</Tag>
                    )}
                  </div>
                  <Paragraph type="secondary" className="!mb-0 text-sm" ellipsis={{ rows: 2 }}>
                    {resume.summary}
                  </Paragraph>
                  <Text type="secondary" className="text-xs">
                    添加于 {new Date(resume.createdAt).toLocaleDateString()}
                  </Text>
                </div>
                <Button
                  type="text"
                  danger
                  icon={<DeleteOutlined />}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDelete(resume.id);
                  }}
                />
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* 上传弹窗 */}
      <Modal
        title="添加简历"
        open={isUploadModalOpen}
        onCancel={() => {
          setIsUploadModalOpen(false);
          setResumeTitle('');
          setFileContent('');
        }}
        footer={null}
      >
        {!fileContent ? (
          <Dragger
            accept=".pdf,.doc,.docx"
            beforeUpload={handleFileUpload}
            showUploadList={false}
            disabled={uploading}
          >
            <p className="ant-upload-drag-icon">
              {uploading ? <LoadingOutlined /> : <InboxOutlined className="text-[#e1b382]" />}
            </p>
            <p className="ant-upload-text">点击或拖拽文件到此区域上传</p>
            <p className="ant-upload-hint">支持 PDF、Word 格式</p>
          </Dragger>
        ) : (
          <div>
            <Input
              value={resumeTitle}
              onChange={(e) => setResumeTitle(e.target.value)}
              placeholder="简历标题"
              className="mb-4"
            />
            <div className="flex justify-end gap-2">
              <Button onClick={() => setFileContent('')}>重新上传</Button>
              <Button
                type="primary"
                onClick={handleSaveResume}
                className="bg-[#e1b382] hover:bg-[#d4a375] border-[#e1b382]"
              >
                保存简历
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* 优化确认弹窗 */}
      <Modal
        title="确认优化"
        open={isOptimizeModalOpen}
        onCancel={() => setIsOptimizeModalOpen(false)}
        onOk={() => {
          setIsOptimizeModalOpen(false);
          handleOptimize();
        }}
        okText="开始优化"
        okButtonProps={{ className: 'bg-[#e1b382] hover:bg-[#d4a375] border-[#e1b382]' }}
      >
        <div className="space-y-3">
          <div>
            <Text strong>优化简历：</Text>
            <Text>{selectedResume?.title}</Text>
          </div>
          <div>
            <Text strong>参考 JD：</Text>
            <div className="mt-2">
              {selectedJDs.map((jd) => (
                <Tag key={jd.id} color="blue" className="mb-1">{jd.title}</Tag>
              ))}
            </div>
          </div>
          <div className="text-gray-500 text-sm">
            AI 将综合考虑这些 JD 的共同要求，生成优化建议。
          </div>
        </div>
      </Modal>

      {/* 优化结果弹窗 */}
      <Modal
        title="优化结果"
        open={!!optimizationResult}
        onCancel={() => setOptimizationResult(null)}
        width={800}
        footer={[
          <Button key="close" onClick={() => setOptimizationResult(null)}>
            关闭
          </Button>,
          <Button
            key="download"
            type="primary"
            className="bg-[#e1b382] hover:bg-[#d4a375] border-[#e1b382]"
            onClick={() => {
              if (optimizationResult) {
                const blob = new Blob([optimizationResult.content], { type: 'text/plain' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `优化简历_${selectedResume?.title || 'resume'}.txt`;
                a.click();
              }
            }}
          >
            下载优化内容
          </Button>,
        ]}
      >
        {optimizationResult && (
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <div className="flex-1">
                <Text type="secondary">优化评分</Text>
                <Progress
                  percent={optimizationResult.score}
                  strokeColor="#e1b382"
                  format={(percent) => <span className="text-lg font-bold">{percent}</span>}
                />
              </div>
            </div>

            <div>
              <Text strong>优化亮点：</Text>
              <div className="mt-2 space-y-2">
                {optimizationResult.highlights.map((highlight, idx) => (
                  <div key={idx} className="flex items-start gap-2">
                    <CheckCircleOutlined className="text-[#e1b382] mt-1" />
                    <Text>{highlight}</Text>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <Text strong>优化后简历：</Text>
              <div className="mt-2 bg-gray-50 p-4 rounded max-h-[400px] overflow-auto">
                <pre className="whitespace-pre-wrap text-sm">{optimizationResult.content}</pre>
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
