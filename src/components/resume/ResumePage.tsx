'use client';

import React, { useState, useCallback } from 'react';
import {
  Row,
  Col,
  Card,
  Typography,
  Button,
  Upload,
  Input,
  Tabs,
  message,
  Spin,
  Alert,
  Space,
  Tag,
} from 'antd';
import { UploadOutlined, FileTextOutlined, EditOutlined, CheckCircleOutlined } from '@ant-design/icons';
import type { UploadFile } from 'antd/es/upload/interface';
import { useInterviewStore } from '@/stores/interviewStore';

const { Title, Text } = Typography;
const { TextArea } = Input;
const { TabPane } = Tabs;
const { Dragger } = Upload;

export default function ResumePage() {
  const [activeTab, setActiveTab] = useState('upload');
  const [fileList, setFileList] = useState<UploadFile[]>([]);
  const [pastedContent, setPastedContent] = useState('');
  const [uploading, setUploading] = useState(false);
  const [optimizing, setOptimizing] = useState(false);
  
  const { 
    resumeContent, 
    setResumeContent,
    jdAnalysis,
    optimizedResume,
    setOptimizedResume,
    resumeFilename,
    setResumeFilename,
  } = useInterviewStore();

  const handleUpload = useCallback(async () => {
    if (fileList.length === 0 && !pastedContent.trim()) {
      message.warning('请上传文件或粘贴简历内容');
      return;
    }

    setUploading(true);
    try {
      const formData = new FormData();
      if (fileList.length > 0 && fileList[0].originFileObj) {
        formData.append('file', fileList[0].originFileObj);
      }
      if (pastedContent.trim()) {
        formData.append('text', pastedContent);
      }

      const response = await fetch('/api/resume/upload', {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();
      
      if (result.success) {
        setResumeContent(result.content);
        setResumeFilename(result.filename);
        message.success('简历上传成功！');
      } else {
        message.error(result.error || '上传失败');
      }
    } catch (error) {
      console.error('上传失败:', error);
      message.error('上传失败，请重试');
    } finally {
      setUploading(false);
    }
  }, [fileList, pastedContent, setResumeContent, setResumeFilename]);

  const handleOptimize = useCallback(async () => {
    if (!resumeContent) {
      message.warning('请先上传简历');
      return;
    }

    if (!jdAnalysis) {
      message.warning('请先进行JD分析，这样AI才能针对性优化简历');
      return;
    }

    setOptimizing(true);
    try {
      const response = await fetch('/api/resume/optimize', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          resumeContent,
          jdAnalysis,
        }),
      });

      const result = await response.json();
      
      if (result.success) {
        setOptimizedResume(result.optimizedContent);
        message.success('简历优化完成！');
      } else {
        message.error(result.error || '优化失败');
      }
    } catch (error) {
      console.error('优化失败:', error);
      message.error('优化失败，请重试');
    } finally {
      setOptimizing(false);
    }
  }, [resumeContent, jdAnalysis, setOptimizedResume]);

  const uploadProps = {
    onRemove: () => {
      setFileList([]);
    },
    beforeUpload: (file: any) => {
      const isPDF = file.type === 'application/pdf';
      const isWord = file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
                     file.type === 'application/msword';

      if (!isPDF && !isWord) {
        message.error('只支持 PDF 或 Word 文件！');
        return Upload.LIST_IGNORE;
      }

      const isLt5M = file.size / 1024 / 1024 < 5;
      if (!isLt5M) {
        message.error('文件大小不能超过 5MB！');
        return Upload.LIST_IGNORE;
      }

      setFileList([{ uid: file.name, name: file.name, status: 'done', originFileObj: file }]);
      return false;
    },
    fileList,
  };

  return (
    <div className="h-full">
      <Row gutter={24} className="h-full">
        {/* 左侧：上传区域 */}
        <Col span={12} className="h-full">
          <Card
            title={
              <Space>
                <FileTextOutlined style={{ color: '#F5A623' }} />
                <span style={{ color: '#5C4A32' }}>上传简历</span>
              </Space>
            }
            className="h-full"
            style={{
              background: '#FFF8E7',
              borderRadius: 16,
              border: '1px solid #E8DFD0',
            }}
            styles={{ body: { height: 'calc(100% - 57px)', overflow: 'auto' } }}
          >
            <Tabs
              activeKey={activeTab}
              onChange={setActiveTab}
              style={{ marginBottom: 24 }}
            >
              <TabPane
                tab={
                  <Space>
                    <UploadOutlined />
                    文件上传
                  </Space>
                }
                key="upload"
              >
                <Dragger {...uploadProps} style={{ background: '#FFFBF5' }}>
                  <p className="ant-upload-drag-icon">
                    <UploadOutlined style={{ color: '#F5A623', fontSize: 48 }} />
                  </p>
                  <p style={{ color: '#5C4A32', fontSize: 16 }}>
                    点击或拖拽文件到此处上传
                  </p>
                  <p style={{ color: '#8B7355' }}>
                    支持 PDF、Word 格式，文件不超过 5MB
                  </p>
                </Dragger>
              </TabPane>

              <TabPane
                tab={
                  <Space>
                    <EditOutlined />
                    直接粘贴
                  </Space>
                }
                key="paste"
              >
                <TextArea
                  rows={10}
                  placeholder="请粘贴您的简历内容..."
                  value={pastedContent}
                  onChange={(e) => setPastedContent(e.target.value)}
                  style={{
                    background: '#FFFBF5',
                    borderColor: '#E8DFD0',
                    resize: 'none',
                  }}
                />
              </TabPane>
            </Tabs>

            {resumeContent && (
              <Alert
                title={
                  <Space>
                    <CheckCircleOutlined style={{ color: '#52C41A' }} />
                    <span>已上传：{resumeFilename}</span>
                  </Space>
                }
                type="success"
                showIcon={false}
                style={{
                  marginBottom: 16,
                  background: '#F6FFED',
                  border: '1px solid #B7EB8F',
                }}
              />
            )}

            <Button
              type="primary"
              size="large"
              onClick={handleUpload}
              loading={uploading}
              disabled={fileList.length === 0 && !pastedContent.trim()}
              block
              style={{
                background: '#F5A623',
                borderColor: '#F5A623',
                height: 48,
                fontSize: 16,
              }}
            >
              {uploading ? '上传中...' : '保存简历'}
            </Button>

            {resumeContent && jdAnalysis && (
              <Button
                type="primary"
                size="large"
                onClick={handleOptimize}
                loading={optimizing}
                block
                style={{
                  marginTop: 12,
                  background: '#FF9500',
                  borderColor: '#FF9500',
                  height: 48,
                  fontSize: 16,
                }}
              >
                {optimizing ? 'AI优化中...' : '✨ AI优化简历'}
              </Button>
            )}

            {!jdAnalysis && resumeContent && (
              <Alert
                message="提示：先去进行JD分析，AI才能针对性优化您的简历"
                type="info"
                showIcon
                style={{ marginTop: 12 }}
              />
            )}
          </Card>
        </Col>

        {/* 右侧：预览区域 */}
        <Col span={12} className="h-full">
          <Card
            title={
              <Space>
                <FileTextOutlined style={{ color: '#F5A623' }} />
                <span style={{ color: '#5C4A32' }}>
                  {optimizedResume ? '优化对比' : '简历预览'}
                </span>
              </Space>
            }
            className="h-full"
            style={{
              background: '#FFF8E7',
              borderRadius: 16,
              border: '1px solid #E8DFD0',
            }}
            styles={{ body: { height: 'calc(100% - 57px)', overflow: 'auto' } }}
          >
            {optimizedResume ? (
              <Tabs defaultActiveKey="optimized">
                <TabPane tab="优化后" key="optimized">
                  <div
                    style={{
                      background: '#FFFBF5',
                      padding: 20,
                      borderRadius: 12,
                      whiteSpace: 'pre-wrap',
                      fontFamily: 'monospace',
                      fontSize: 14,
                      lineHeight: 1.8,
                      color: '#5C4A32',
                      border: '1px solid #E8DFD0',
                    }}
                  >
                    {optimizedResume}
                  </div>
                </TabPane>
                <TabPane tab="原始简历" key="original">
                  <div
                    style={{
                      background: '#FFFBF5',
                      padding: 20,
                      borderRadius: 12,
                      whiteSpace: 'pre-wrap',
                      fontFamily: 'monospace',
                      fontSize: 14,
                      lineHeight: 1.8,
                      color: '#5C4A32',
                      border: '1px solid #E8DFD0',
                    }}
                  >
                    {resumeContent}
                  </div>
                </TabPane>
              </Tabs>
            ) : resumeContent ? (
              <div
                style={{
                  background: '#FFFBF5',
                  padding: 20,
                  borderRadius: 12,
                  whiteSpace: 'pre-wrap',
                  fontFamily: 'monospace',
                  fontSize: 14,
                  lineHeight: 1.8,
                  color: '#5C4A32',
                  border: '1px solid #E8DFD0',
                }}
              >
                {resumeContent}
              </div>
            ) : (
              <div
                style={{
                  textAlign: 'center',
                  padding: '60px 20px',
                  color: '#8B7355',
                }}
              >
                <FileTextOutlined style={{ fontSize: 48, marginBottom: 16 }} />
                <p>请先上传或粘贴简历</p>
              </div>
            )}
          </Card>
        </Col>
      </Row>
    </div>
  );
}
