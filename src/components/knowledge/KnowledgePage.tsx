'use client';

import { useState, useMemo, useCallback } from 'react';
import {
  Upload,
  Card,
  Input,
  Select,
  Button,
  Tag,
  Space,
  Typography,
  Empty,
  Modal,
  Descriptions,
  message,
} from 'antd';
import {
  UploadOutlined,
  SearchOutlined,
  EyeOutlined,
  DeleteOutlined,
  FileTextOutlined,
  DatabaseOutlined,
  LoadingOutlined,
} from '@ant-design/icons';
import { useKnowledgeStore } from '@/stores/knowledgeStore';
import { useAuthStore } from '@/stores/authStore';
import type { KnowledgeDocument } from '@/types';

const { Title, Text } = Typography;
const { Search } = Input;
const { Option } = Select;
const { confirm } = Modal;

export default function KnowledgePage() {
  const { documents, addDocument, deleteDocument } = useKnowledgeStore();
  const { user } = useAuthStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [uploading, setUploading] = useState(false);
  const [selectedType, setSelectedType] = useState<KnowledgeDocument['sourceType']>('interview_notes');
  const [viewDoc, setViewDoc] = useState<KnowledgeDocument | null>(null);

  const typeOptions = [
    { value: 'all', label: '全部' },
    { value: 'interview_notes', label: '面经', color: 'blue' },
    { value: 'question_bank', label: '题库', color: 'purple' },
    { value: 'company_info', label: '公司信息', color: 'orange' },
  ];

  const filteredDocuments = documents.filter(doc => {
    const matchesSearch = !searchQuery || 
      doc.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      doc.content.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = filterType === 'all' || doc.sourceType === filterType;
    return matchesSearch && matchesType;
  });

  const handleUpload = useCallback(async (file: File) => {
    if (!user?.email) {
      message.error('请先登录');
      return false;
    }

    setUploading(true);
    try {
      const content = await file.text();

      // addDocument 是异步的，内部自动切分和向量化
      await addDocument({
        title: file.name.replace(/\.[^/.]+$/, ''),
        content,
        sourceType: selectedType,
        userId: user.email,
      });

      message.success('文档上传成功！向量生成中...');
      return false;
    } catch (error) {
      console.error('Upload error:', error);
      message.error('上传失败');
      return false;
    } finally {
      setUploading(false);
    }
  }, [user, selectedType, addDocument]);

  const handleDelete = useCallback((docId: string) => {
    confirm({
      title: '确认删除',
      content: '删除后无法恢复，是否继续？',
      okText: '删除',
      okType: 'danger',
      cancelText: '取消',
      onOk() {
        deleteDocument(docId);
        message.success('删除成功');
      },
    });
  }, [deleteDocument]);

  const getTypeLabel = (type: KnowledgeDocument['sourceType']) => {
    const option = typeOptions.find(o => o.value === type);
    return option || { value: type, label: type, color: 'default' as const };
  };

  const totalChunks = useMemo(() => {
    return documents.reduce((sum, doc) => sum + (doc.chunks?.length || 0), 0);
  }, [documents]);

  const totalSegments = useMemo(() => {
    return documents.reduce((sum, doc) => {
      return sum + (doc.chunks?.reduce((s, c) => s + (c.segments?.length || 0), 0) || 0);
    }, 0);
  }, [documents]);

  return (
    <div style={{ maxWidth: 1200, margin: '0 auto' }}>
      <Title level={2}>知识库管理</Title>

      <Card style={{ marginBottom: 24 }}>
        <Space direction="vertical" style={{ width: '100%' }}>
          <Text type="secondary">
            支持上传面经、题库、公司信息等文档。文档将自动切分为三级结构（文档-段落-句子）并向量化，供 AI 面试时检索使用。
          </Text>
          
          <Space>
            <Select
              value={selectedType}
              onChange={setSelectedType}
              style={{ width: 150 }}
            >
              <Option value="interview_notes">面经</Option>
              <Option value="question_bank">题库</Option>
              <Option value="company_info">公司信息</Option>
            </Select>
            
            <Upload
              accept=".txt,.md,.doc,.docx,.pdf"
              beforeUpload={handleUpload}
              showUploadList={false}
              disabled={uploading}
            >
              <Button 
                icon={uploading ? <LoadingOutlined /> : <UploadOutlined />}
                type="primary"
                disabled={uploading}
              >
                {uploading ? '上传中...' : '上传文档'}
              </Button>
            </Upload>
          </Space>
        </Space>
      </Card>

      <Card>
        <Space style={{ marginBottom: 16, width: '100%', justifyContent: 'space-between' }}>
          <Space>
            <Search
              placeholder="搜索文档标题或内容"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              style={{ width: 300 }}
              prefix={<SearchOutlined />}
            />
            <Select
              value={filterType}
              onChange={setFilterType}
              style={{ width: 120 }}
            >
              {typeOptions.map(opt => (
                <Option key={opt.value} value={opt.value}>{opt.label}</Option>
              ))}
            </Select>
          </Space>
          <Text type="secondary">
            共 {filteredDocuments.length} 个文档 | {totalChunks} 个段落 | {totalSegments} 个片段
          </Text>
        </Space>

        {filteredDocuments.length === 0 ? (
          <Empty description="暂无文档" />
        ) : (
          <Space direction="vertical" style={{ width: '100%' }}>
            {filteredDocuments.map(doc => (
              <Card 
                key={doc.id} 
                size="small"
                actions={[
                  <Button 
                    key="view" 
                    icon={<EyeOutlined />} 
                    type="link"
                    onClick={() => setViewDoc(doc)}
                  >
                    查看
                  </Button>,
                  <Button 
                    key="delete" 
                    icon={<DeleteOutlined />} 
                    type="link" 
                    danger
                    onClick={() => doc.id && handleDelete(doc.id)}
                  >
                    删除
                  </Button>,
                ]}
              >
                <Space direction="vertical" style={{ width: '100%' }}>
                  <Space>
                    <Text strong>{doc.title}</Text>
                    <Tag color={getTypeLabel(doc.sourceType).color}>
                      {getTypeLabel(doc.sourceType).label}
                    </Tag>
                  </Space>
                  <Text type="secondary" style={{ fontSize: 12 }}>
                    {new Date(doc.createdAt).toLocaleString()} | 
                    {doc.content.length} 字 | 
                    {doc.chunks?.length || 0} 段落 | 
                    {doc.chunks?.reduce((sum, c) => sum + (c.segments?.length || 0), 0) || 0} 片段
                  </Text>
                </Space>
              </Card>
            ))}
          </Space>
        )}
      </Card>

      <Modal
        title={viewDoc?.title}
        open={!!viewDoc}
        onCancel={() => setViewDoc(null)}
        width={800}
        footer={null}
      >
        {viewDoc && (
          <Descriptions column={2} bordered>
            <Descriptions.Item label="文档类型">
              <Tag color={getTypeLabel(viewDoc.sourceType).color}>
                {getTypeLabel(viewDoc.sourceType).label}
              </Tag>
            </Descriptions.Item>
            <Descriptions.Item label="创建时间">
              {new Date(viewDoc.createdAt).toLocaleString()}
            </Descriptions.Item>
            <Descriptions.Item label="文档字数">
              {viewDoc.content.length} 字
            </Descriptions.Item>
            <Descriptions.Item label="段落数量">
              {viewDoc.chunks?.length || 0} 个
            </Descriptions.Item>
            <Descriptions.Item label="片段数量" span={2}>
              {viewDoc.chunks?.reduce((sum, c) => sum + (c.segments?.length || 0), 0) || 0} 个
            </Descriptions.Item>
            <Descriptions.Item label="文档内容" span={2}>
              <div style={{ maxHeight: 400, overflow: 'auto', whiteSpace: 'pre-wrap' }}>
                {viewDoc.content}
              </div>
            </Descriptions.Item>
          </Descriptions>
        )}
      </Modal>
    </div>
  );
}
