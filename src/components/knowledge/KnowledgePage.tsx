'use client';

import { useState, useEffect } from 'react';
import { 
  Card, Button, Upload, Typography, Tag, Space, Row, Col, message, 
  Modal, Input, Select, Empty, Popconfirm 
} from 'antd';
import { 
  BookOutlined, UploadOutlined, FileTextOutlined, EyeOutlined, 
  DeleteOutlined, SearchOutlined, FilterOutlined 
} from '@ant-design/icons';
import { useKnowledgeStore } from '@/stores/knowledgeStore';
import { useAuthStore } from '@/stores/authStore';
import type { KnowledgeDocument } from '@/types';

const { Title, Text, Paragraph } = Typography;
const { Dragger } = Upload;
const { Search } = Input;

const typeOptions = [
  { value: 'interview_notes', label: '面经', color: 'orange' },
  { value: 'question_bank', label: '题库', color: 'blue' },
  { value: 'company_info', label: '公司信息', color: 'green' },
];

export default function KnowledgePage() {
  const { documents, addDocument, deleteDocument } = useKnowledgeStore();
  const { user } = useAuthStore();
  const [fileList, setFileList] = useState<any[]>([]);
  const [uploading, setUploading] = useState(false);
  const [selectedType, setSelectedType] = useState<string>('interview_notes');
  const [searchKeyword, setSearchKeyword] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [viewModalVisible, setViewModalVisible] = useState(false);
  const [currentDoc, setCurrentDoc] = useState<KnowledgeDocument | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const props = {
    name: 'file',
    multiple: false,
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
    if (!user?.id) {
      message.error('请先登录');
      return;
    }

    setUploading(true);
    try {
      const file = fileList[0];
      
      // 读取文件内容
      let content = '';
      if (file.originFileObj) {
        content = await file.originFileObj.text();
      }

      // 添加到 store
      addDocument({
        userId: user.id,
        title: file.name.replace(/\.[^/.]+$/, ''),
        sourceType: selectedType as any,
        originalFilename: file.name,
        content: content,
      });

      message.success('文档上传成功！');
      setFileList([]);
    } catch (error) {
      message.error('上传失败');
      console.error(error);
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = (id: string) => {
    deleteDocument(id);
    message.success('删除成功');
  };

  const handleView = (doc: KnowledgeDocument) => {
    setCurrentDoc(doc);
    setViewModalVisible(true);
  };

  const getTypeTag = (type: string) => {
    const option = typeOptions.find((o) => o.value === type);
    return option || { color: 'default', label: '其他' };
  };

  // 筛选文档
  const filteredDocuments = documents.filter((doc) => {
    const matchKeyword = doc.title.toLowerCase().includes(searchKeyword.toLowerCase()) ||
      (doc.content && doc.content.toLowerCase().includes(searchKeyword.toLowerCase()));
    const matchType = filterType === 'all' || doc.sourceType === filterType;
    return matchKeyword && matchType;
  });

  if (!mounted) return null;

  return (
    <div style={{ maxWidth: 1000, margin: '0 auto' }}>
      {/* 上传区域 */}
      <Card style={{ borderRadius: 16, marginBottom: 24 }}>
        <Title level={4} style={{ marginBottom: 24 }}>
          <BookOutlined style={{ marginRight: 8, color: '#F5A623' }} />
          上传知识库文档
        </Title>

        <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
          <Col span={24}>
            <Text>选择文档类型：</Text>
            <Select
              value={selectedType}
              onChange={setSelectedType}
              style={{ width: 200, marginLeft: 8 }}
              options={typeOptions}
            />
          </Col>
        </Row>

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
            {uploading ? '上传中...' : '上传文档'}
          </Button>
        </div>
      </Card>

      {/* 文档列表 */}
      <Card style={{ borderRadius: 16 }}>
        <Title level={4} style={{ marginBottom: 24 }}>
          <FileTextOutlined style={{ marginRight: 8 }} />
          我的知识库
          <Text type="secondary" style={{ marginLeft: 8, fontSize: 14 }}>
            ({filteredDocuments.length} 个文档)
          </Text>
        </Title>

        {/* 搜索和筛选 */}
        <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
          <Col xs={24} md={12}>
            <Search
              placeholder="搜索文档标题或内容..."
              value={searchKeyword}
              onChange={(e) => setSearchKeyword(e.target.value)}
              allowClear
              prefix={<SearchOutlined />}
            />
          </Col>
          <Col xs={24} md={12}>
            <Select
              value={filterType}
              onChange={setFilterType}
              style={{ width: '100%' }}
              placeholder="筛选类型"
              prefix={<FilterOutlined />}
              options={[
                { value: 'all', label: '全部类型' },
                ...typeOptions,
              ]}
            />
          </Col>
        </Row>

        {/* 文档列表 */}
        {filteredDocuments.length === 0 ? (
          <Empty
            description={
              documents.length === 0 
                ? '暂无文档，请先上传' 
                : '没有找到匹配的文档'
            }
          />
        ) : (
          <Row gutter={[16, 16]}>
            {filteredDocuments.map((item) => {
              const typeInfo = getTypeTag(item.sourceType);
              return (
                <Col xs={24} key={item.id}>
                  <Card
                    size="small"
                    style={{ borderRadius: 12, backgroundColor: '#FFF8E7' }}
                    styles={{ body: { padding: 16 } }}
                  >
                    <Row align="middle" gutter={[16, 16]}>
                      <Col flex="48px">
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
                      </Col>
                      <Col flex="auto">
                        <Space orientation="vertical" size={4} style={{ width: '100%' }}>
                          <Space>
                            <Text strong style={{ fontSize: 15 }}>{item.title}</Text>
                            <Tag color={typeInfo.color}>{typeInfo.label}</Tag>
                          </Space>
                          <Text type="secondary">
                            上传于 {new Date(item.createdAt).toLocaleDateString('zh-CN')}
                            {item.originalFilename && ` · ${item.originalFilename}`}
                          </Text>
                        </Space>
                      </Col>
                      <Col>
                        <Space>
                          <Button 
                            type="link" 
                            icon={<EyeOutlined />} 
                            size="small"
                            onClick={() => handleView(item)}
                          >
                            查看
                          </Button>
                          <Popconfirm
                            title="确定要删除这个文档吗？"
                            onConfirm={() => handleDelete(item.id!)}
                            okText="确定"
                            cancelText="取消"
                          >
                            <Button type="link" icon={<DeleteOutlined />} size="small" danger>
                              删除
                            </Button>
                          </Popconfirm>
                        </Space>
                      </Col>
                    </Row>
                  </Card>
                </Col>
              );
            })}
          </Row>
        )}
      </Card>

      {/* 查看文档弹窗 */}
      <Modal
        title={currentDoc?.title}
        open={viewModalVisible}
        onCancel={() => setViewModalVisible(false)}
        footer={[
          <Button key="close" onClick={() => setViewModalVisible(false)}>
            关闭
          </Button>,
        ]}
        width={800}
      >
        {currentDoc && (
          <Space orientation="vertical" style={{ width: '100%' }} size="large">
            <Space>
              <Tag color={getTypeTag(currentDoc.sourceType).color}>
                {getTypeTag(currentDoc.sourceType).label}
              </Tag>
              <Text type="secondary">
                上传于 {new Date(currentDoc.createdAt).toLocaleString('zh-CN')}
              </Text>
            </Space>
            
            <Card 
              style={{ 
                backgroundColor: '#f5f5f5', 
                maxHeight: 400, 
                overflow: 'auto' 
              }}
            >
              {currentDoc.content ? (
                <Paragraph style={{ whiteSpace: 'pre-wrap' }}>
                  {currentDoc.content}
                </Paragraph>
              ) : (
                <Empty description="暂无内容预览" />
              )}
            </Card>
          </Space>
        )}
      </Modal>
    </div>
  );
}
