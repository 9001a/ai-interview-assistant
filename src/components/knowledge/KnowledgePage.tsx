'use client';

import { useState } from 'react';
import { Card, Button, Upload, Typography, List, Tag, Space, message } from 'antd';
import { BookOutlined, UploadOutlined, FileTextOutlined } from '@ant-design/icons';

const { Title, Text } = Typography;
const { Dragger } = Upload;

const mockDocuments = [
  {
    id: '1',
    title: '字节跳动Java面经-2024.pdf',
    type: 'interview_notes',
    date: '2024-01-15',
  },
  {
    id: '2',
    title: '高频面试题集.docx',
    type: 'question_bank',
    date: '2024-01-10',
  },
];

export default function KnowledgePage() {
  const [fileList, setFileList] = useState<any[]>([]);
  const [uploading, setUploading] = useState(false);

  const props = {
    name: 'file',
    multiple: true,
    accept: '.pdf,.docx,.doc,.txt,.md',
    fileList,
    beforeUpload: () => false,
    onChange: ({ fileList: newFileList }: any) => {
      setFileList(newFileList);
    },
  };

  const handleUpload = async () => {
    if (fileList.length === 0) {
      message.warning('请先选择文件');
      return;
    }
    setUploading(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 1500));
      message.success('文件上传成功！正在向量化...');
      await new Promise((resolve) => setTimeout(resolve, 1000));
      message.success('向量化完成！可以用于面试参考了');
      setFileList([]);
    } catch (error) {
      message.error('上传失败');
    } finally {
      setUploading(false);
    }
  };

  const getTypeTag = (type: string) => {
    const tags: Record<string, { color: string; text: string }> = {
      interview_notes: { color: 'orange', text: '面经' },
      question_bank: { color: 'blue', text: '题库' },
      company_info: { color: 'green', text: '公司信息' },
    };
    return tags[type] || { color: 'default', text: '其他' };
  };

  return (
    <div style={{ maxWidth: 900, margin: '0 auto' }}>
      <Card style={{ borderRadius: 16, marginBottom: 24 }}>
        <Title level={4} style={{ marginBottom: 24 }}>
          <BookOutlined style={{ marginRight: 8, color: '#F5A623' }} />
          上传知识库文档
        </Title>

        <Dragger {...props} style={{ borderRadius: 12, marginBottom: 24 }}>
          <p className="ant-upload-drag-icon">
            <UploadOutlined style={{ fontSize: 48, color: '#F5A623' }} />
          </p>
          <p className="ant-upload-text" style={{ fontSize: 16 }}>
            点击或拖拽文件到此处
          </p>
          <p className="ant-upload-hint">
            支持 PDF、Word、TXT、Markdown 格式的面经、题库、公司介绍等
          </p>
        </Dragger>

        <div style={{ textAlign: 'center' }}>
          <Button
            type="primary"
            size="large"
            onClick={handleUpload}
            loading={uploading}
            disabled={fileList.length === 0}
            style={{ height: 48, minWidth: 160 }}
          >
            {uploading ? '处理中...' : '上传并向量化'}
          </Button>
        </div>
      </Card>

      <Card style={{ borderRadius: 16 }}>
        <Title level={4} style={{ marginBottom: 24 }}>
          <FileTextOutlined style={{ marginRight: 8 }} />
          我的知识库
        </Title>

        <List
          itemLayout="horizontal"
          dataSource={mockDocuments}
          renderItem={(item) => {
            const tagInfo = getTypeTag(item.type);
            return (
              <List.Item
                actions={[
                  <Button type="link" size="small">查看</Button>,
                  <Button type="link" size="small" danger>删除</Button>,
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
                      📄
                    </div>
                  }
                  title={
                    <Space>
                      <Text strong style={{ fontSize: 15 }}>{item.title}</Text>
                      <Tag color={tagInfo.color}>{tagInfo.text}</Tag>
                    </Space>
                  }
                  description={<Text type="secondary">上传于 {item.date}</Text>}
                />
              </List.Item>
            );
          }}
        />
      </Card>
    </div>
  );
}
