'use client';

import { useState, useRef } from 'react';
import {
  Card,
  Form,
  Input,
  Button,
  Typography,
  Tabs,
  Upload,
  Row,
  Col,
  Alert,
  Space,
  message,
  Progress,
} from 'antd';
import {
  FileTextOutlined,
  CloudUploadOutlined,
  PaperClipOutlined,
  EditOutlined,
  CheckCircleOutlined,
} from '@ant-design/icons';
import type { UploadProps } from 'antd';
import { useInterviewStore } from '@/stores/interviewStore';
import { resumeApi } from '@/services/api';

const { Title, Text } = Typography;
const { TextArea } = Input;
const { Dragger } = Upload;

const RESUME_TAB_ITEMS = [
  {
    key: 'upload',
    label: (
      <span>
        <CloudUploadOutlined /> 文件上传
      </span>
    ),
  },
  {
    key: 'paste',
    label: (
      <span>
        <EditOutlined /> 直接粘贴
      </span>
    ),
  },
];

export default function ResumePage() {
  const [loading, setLoading] = useState(false);
  const [resumeText, setResumeText] = useState('');
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { setResume, resume, jdAnalysis } = useInterviewStore();

  // 简历解析
  const handleUpload = async (values: { resumeText: string }) => {
    if (!values.resumeText.trim()) {
      message.warning('请上传简历或粘贴简历内容');
      return;
    }

    setLoading(true);
    try {
      const res = await resumeApi.parse(values.resumeText);
      
      if (res.content) {
        setResume(res.content);
        setResumeText(res.content);
        message.success('简历已保存！');
      }
    } catch (error: any) {
      message.error(error.response?.data?.error || '解析失败');
    } finally {
      setLoading(false);
    }
  };

  // 文件上传属性
  const uploadProps: UploadProps = {
    name: 'file',
    multiple: false,
    accept: '.pdf,.docx,.doc',
    beforeUpload: async (file) => {
      const isPDF = file.type === 'application/pdf';
      const isWord =
        file.type ===
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
        file.type === 'application/msword';

      if (!isPDF && !isWord) {
        message.error('只支持 PDF 或 Word 文件');
        return Upload.LIST_IGNORE;
      }

      const isLt10M = file.size / 1024 / 1024 < 10;
      if (!isLt10M) {
        message.error('文件大小不能超过 10MB');
        return Upload.LIST_IGNORE;
      }

      setUploadedFile(file);
      setLoading(true);
      
      try {
        const res = await resumeApi.upload(file);
        if (res.content) {
          setResumeText(res.content);
          message.success('简历已解析！');
        }
      } catch (error: any) {
        message.error(error.response?.data?.error || '文件解析失败');
      } finally {
        setLoading(false);
      }

      return false;
    },
  };

  return (
    <div className="p-6">
      <Row gutter={[24, 24]}>
        {/* 左侧：简历输入 */}
        <Col xs={24} lg={12}>
          <Card
            title="📄 简历输入"
            className="h-full"
            styles={{ header: { backgroundColor: '#FFF8E7' } }}
          >
            <Tabs
              defaultActiveKey="upload"
              items={RESUME_TAB_ITEMS.map((item) => ({
                ...item,
                children: (
                  item.key === 'upload' ? (
                    <div className="mb-4">
                      <Dragger {...uploadProps} fileList={uploadedFile ? [{ uid: '1', name: uploadedFile.name, status: 'done' }] : []}>
                        <p className="ant-upload-drag-icon">
                          <PaperClipOutlined style={{ fontSize: 48, color: '#F5A623' }} />
                        </p>
                        <p className="ant-upload-text">点击或拖拽文件到此处上传</p>
                        <p className="ant-upload-hint">
                          支持 PDF (.pdf) 或 Word (.docx/.doc)，文件大小不超过 10MB
                        </p>
                      </Dragger>
                    </div>
                  ) : null
                ),
              }))}
              className="mb-4"
            />

            <Form
              name="resume_input"
              onFinish={handleUpload}
              layout="vertical"
              initialValues={{ resumeText: resume?.text || '' }}
            >
              <Form.Item
                name="resumeText"
                label="简历内容"
                rules={[{ required: true, message: '请提供简历内容' }]}
              >
                <TextArea
                  rows={12}
                  placeholder="直接粘贴简历内容到这里..."
                  showCount
                  maxLength={10000}
                  value={resumeText}
                  onChange={(e) => setResumeText(e.target.value)}
                  style={{ fontFamily: 'inherit', fontSize: '14px' }}
                />
              </Form.Item>

              <Form.Item>
                <Button
                  type="primary"
                  htmlType="submit"
                  loading={loading}
                  size="large"
                  block
                  style={{
                    backgroundColor: '#F5A623',
                    borderColor: '#F5A623',
                    height: '48px',
                    borderRadius: '12px',
                  }}
                  icon={<CheckCircleOutlined />}
                >
                  {loading ? '正在解析...' : '保存简历'}
                </Button>
              </Form.Item>
            </Form>

            <Alert
              title="💡 提示"
              description="支持文件上传或直接粘贴简历文本，AI会根据JD针对性优化"
              type="info"
              showIcon
            />
          </Card>
        </Col>

        {/* 右侧：预览 */}
        <Col xs={24} lg={12}>
          <Card
            title="📄 简历预览"
            className="h-full"
            styles={{ header: { backgroundColor: '#FFF8E7' } }}
          >
            {loading ? (
              <div className="text-center py-16">
                <Progress type="circle" percent={60} />
                <div className="mt-4 text-gray-500">正在解析简历，请稍候...</div>
              </div>
            ) : resumeText || resume?.text ? (
              <div className="whitespace-pre-wrap p-6 bg-amber-50 rounded-lg min-h-96">
                {resumeText || resume?.text}
              </div>
            ) : (
              <div className="text-center py-16">
                <div className="text-5xl mb-4">📄</div>
                <Text type="secondary">请先上传或粘贴简历内容</Text>
              </div>
            )}

            {jdAnalysis && (
              <Alert
                title="📋 已关联 JD"
                description={`岗位：${jdAnalysis.analysis?.overview?.substring(0, 50) || '岗位'}...`}
                type="success"
                showIcon
                className="mt-4"
              />
            )}
          </Card>
        </Col>
      </Row>

      {(resumeText || resume?.text) && (
        <div className="mt-6 flex justify-center">
          <Space size="large">
            {jdAnalysis && (
              <Button
                type="primary"
                size="large"
                style={{
                  backgroundColor: '#F5A623',
                  borderColor: '#F5A623',
                }}
                onClick={() => {
                  message.info('继续功能开发中...');
                }}
              >
                开始模拟面试 →
              </Button>
            )}
          </Space>
        </div>
      )}
    </div>
  );
}
