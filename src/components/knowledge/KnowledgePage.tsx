'use client';

import { useState, useEffect, useCallback } from 'react';
import { 
  Card, Button, Upload, Typography, Tag, Space, Row, Col, message, 
  Modal, Input, Select, Empty, Popconfirm, Badge, Spin, Tabs, List 
} from 'antd';
import { 
  BookOutlined, UploadOutlined, FileTextOutlined, EyeOutlined, 
  DeleteOutlined, SearchOutlined, FilterOutlined, DatabaseOutlined,
  CheckCircleOutlined, SyncOutlined, RobotOutlined
} from '@ant-design/icons';
import { useKnowledgeStore, type RetrievalResult } from '@/stores/knowledgeStore';
import { useAuthStore } from '@/stores/authStore';
import type { KnowledgeDocument } from '@/types';

const { Title, Text, Paragraph } = Typography;
const { Dragger } = Upload;
const { Search } = Input;
const { TabPane } = Tabs;

const typeOptions = [
  { value: 'interview_notes', label: '面经', color: 'orange' },
  { value: 'question_bank', label: '题库', color: 'blue' },
  { value: 'company_info', label: '公司信息', color: 'green' },
];

export default function KnowledgePage() {
  const { 
    documents, 
    addDocument, 
    deleteDocument, 
    generateEmbedding,
    searchByVector,
    searchByKeyword,
    hybridSearch 
  } = useKnowledgeStore();
  const { user } = useAuthStore();
  const [fileList, setFileList] = useState<any[]>([]);
  const [uploading, setUploading] = useState(false);
  const [selectedType, setSelectedType] = useState<string>('interview_notes');
  const [searchKeyword, setSearchKeyword] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [viewModalVisible, setViewModalVisible] = useState(false);
  const [ragModalVisible, setRagModalVisible] = useState(false);
  const [currentDoc, setCurrentDoc] = useState<KnowledgeDocument | null>(null);
  const [mounted, setMounted] = useState(false);
  
  // RAG 搜索相关
  const [ragQuery, setRagQuery] = useState('');
  const [ragResults, setRagResults] = useState<RetrievalResult[]>([]);
  const [ragLoading, setRagLoading] = useState(false);
  const [ragMode, setRagMode] = useState<'vector' | 'keyword' | 'hybrid'>('hybrid');
  
  // 向量化状态
  const [generatingId, setGeneratingId] = useState<string | null>(null);

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

    const file = fileList[0].originFileObj;
    if (!file) return;

    setUploading(true);
    try {
      // 读取文件内容
      const content = await readFileContent(file);
      
      await addDocument({
        title: file.name.replace(/\.[^/.]+$/, ''),
        content,
        sourceType: selectedType as KnowledgeDocument['sourceType'],
        originalFilename: file.name,
        userId: user?.id || '',
      });

      message.success('文档上传成功！已自动生成向量索引');
      setFileList([]);
    } catch (error) {
      message.error('上传失败');
      console.error(error);
    } finally {
      setUploading(false);
    }
  };

  const readFileContent = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        resolve(e.target?.result as string || '');
      };
      reader.onerror = reject;
      reader.readAsText(file);
    });
  };

  const handleView = (doc: KnowledgeDocument) => {
    setCurrentDoc(doc);
    setViewModalVisible(true);
  };

  const handleDelete = (id: string) => {
    deleteDocument(id);
    message.success('已删除');
  };

  // 手动生成向量
  const handleGenerateEmbedding = async (doc: KnowledgeDocument) => {
    if (!doc.id || !doc.content) return;
    
    setGeneratingId(doc.id);
    try {
      await generateEmbedding(doc.id);
      message.success('向量生成成功！');
    } catch (error) {
      message.error('向量生成失败');
    } finally {
      setGeneratingId(null);
    }
  };

  // RAG 搜索
  const handleRagSearch = useCallback(async () => {
    if (!ragQuery.trim()) {
      message.warning('请输入搜索内容');
      return;
    }

    setRagLoading(true);
    try {
      let results: RetrievalResult[] = [];
      
      switch (ragMode) {
        case 'vector':
          results = await searchByVector(ragQuery, 5);
          break;
        case 'keyword':
          results = searchByKeyword(ragQuery);
          break;
        case 'hybrid':
        default:
          results = await hybridSearch(ragQuery, 5);
          break;
      }
      
      setRagResults(results);
      
      if (results.length === 0) {
        message.info('未找到相关文档');
      }
    } catch (error) {
      message.error('搜索失败');
      console.error(error);
    } finally {
      setRagLoading(false);
    }
  }, [ragQuery, ragMode, searchByVector, searchByKeyword, hybridSearch]);

  // 过滤文档
  const filteredDocuments = documents.filter((doc) => {
    const matchType = filterType === 'all' || doc.sourceType === filterType;
    const matchKeyword = !searchKeyword || 
      doc.title.toLowerCase().includes(searchKeyword.toLowerCase()) ||
      (doc.content && doc.content.toLowerCase().includes(searchKeyword.toLowerCase()));
    return matchType && matchKeyword;
  });

  const getTypeLabel = (type: string) => {
    const option = typeOptions.find(o => o.value === type);
    return option ? { text: option.label, color: option.color } : { text: type, color: 'default' };
  };

  // 统计
  const totalDocs = documents.length;
  const embeddedDocs = documents.filter(d => d.embedding).length;
  const interviewNotesCount = documents.filter(d => d.sourceType === 'interview_notes').length;
  const questionBankCount = documents.filter(d => d.sourceType === 'question_bank').length;
  const companyInfoCount = documents.filter(d => d.sourceType === 'company_info').length;

  if (!mounted) return null;

  return (
    <div className="p-6">
      <Row gutter={[24, 24]}>
        {/* 左侧：统计和操作 */}
        <Col span={6}>
          <Card className="mb-4">
            <Space direction="vertical" className="w-full" size="large">
              <div>
                <Text type="secondary">文档总数</Text>
                <div className="text-2xl font-bold">{totalDocs}</div>
              </div>
              <div>
                <Text type="secondary">已向量化</Text>
                <div className="flex items-center gap-2">
                  <span className="text-2xl font-bold text-green-500">{embeddedDocs}</span>
                  <Badge count={`${Math.round((embeddedDocs / Math.max(totalDocs, 1)) * 100)}%`} style={{ backgroundColor: '#52c41a' }} />
                </div>
              </div>
            </Space>
          </Card>
          
          <Card className="mb-4">
            <Space direction="vertical" className="w-full">
              <div className="flex justify-between">
                <Tag color="orange">面经</Tag>
                <span>{interviewNotesCount}</span>
              </div>
              <div className="flex justify-between">
                <Tag color="blue">题库</Tag>
                <span>{questionBankCount}</span>
              </div>
              <div className="flex justify-between">
                <Tag color="green">公司信息</Tag>
                <span>{companyInfoCount}</span>
              </div>
            </Space>
          </Card>

          <Card>
            <Button 
              type="primary" 
              icon={<RobotOutlined />}
              block
              size="large"
              onClick={() => setRagModalVisible(true)}
            >
              智能检索 (RAG)
            </Button>
          </Card>
        </Col>

        {/* 右侧：文档列表和上传 */}
        <Col span={18}>
          {/* 上传区域 */}
          <Card title="上传文档" className="mb-4">
            <Row gutter={16}>
              <Col span={16}>
                <Dragger {...props}>
                  <p className="ant-upload-drag-icon">
                    <UploadOutlined />
                  </p>
                  <p className="ant-upload-text">点击或拖拽文件上传</p>
                  <p className="ant-upload-hint">
                    支持 PDF、Word、TXT、Markdown 格式，自动进行向量索引
                  </p>
                </Dragger>
              </Col>
              <Col span={8}>
                <Space direction="vertical" className="w-full">
                  <Text>文档类型</Text>
                  <Select
                    value={selectedType}
                    onChange={setSelectedType}
                    options={typeOptions}
                    className="w-full"
                  />
                  <Button
                    type="primary"
                    loading={uploading}
                    disabled={fileList.length === 0}
                    onClick={handleUpload}
                    block
                  >
                    开始上传
                  </Button>
                </Space>
              </Col>
            </Row>
          </Card>

          {/* 搜索和筛选 */}
          <Card className="mb-4">
            <Row gutter={16} align="middle">
              <Col span={12}>
                <Search
                  placeholder="搜索文档标题或内容"
                  value={searchKeyword}
                  onChange={(e) => setSearchKeyword(e.target.value)}
                  allowClear
                />
              </Col>
              <Col span={8}>
                <Space>
                  <FilterOutlined />
                  <Select
                    value={filterType}
                    onChange={setFilterType}
                    style={{ width: 150 }}
                    options={[
                      { value: 'all', label: '全部' },
                      ...typeOptions,
                    ]}
                  />
                </Space>
              </Col>
            </Row>
          </Card>

          {/* 文档列表 */}
          <Card title={`文档列表 (${filteredDocuments.length})`}>
            <Row gutter={[16, 16]}>
              {filteredDocuments.map((doc) => {
                const typeLabel = getTypeLabel(doc.sourceType);
                const hasEmbedding = !!doc.embedding;
                
                return (
                  <Col span={12} key={doc.id}>
                    <Card 
                      size="small" 
                      hoverable
                      className="h-full"
                      actions={[
                        <Button 
                          key="view" 
                          type="link" 
                          icon={<EyeOutlined />}
                          onClick={() => handleView(doc)}
                        >
                          查看
                        </Button>,
                        !hasEmbedding && (
                          <Button
                            key="embed"
                            type="link"
                            icon={<SyncOutlined spin={generatingId === doc.id} />}
                            loading={generatingId === doc.id}
                            onClick={() => handleGenerateEmbedding(doc)}
                          >
                            向量化
                          </Button>
                        ),
                        <Popconfirm
                          key="delete"
                          title="确认删除？"
                          onConfirm={() => doc.id && handleDelete(doc.id)}
                        >
                          <Button type="link" danger icon={<DeleteOutlined />}>
                            删除
                          </Button>
                        </Popconfirm>,
                      ].filter(Boolean)}
                    >
                      <Card.Meta
                        title={
                          <Space>
                            <FileTextOutlined />
                            <span className="truncate max-w-[200px]">{doc.title}</span>
                            <Tag color={typeLabel.color as any}>{typeLabel.text}</Tag>
                            {hasEmbedding ? (
                              <Badge status="success" text="已索引" />
                            ) : (
                              <Badge status="default" text="未索引" />
                            )}
                          </Space>
                        }
                        description={
                          <Space direction="vertical" className="w-full">
                            <Text type="secondary" className="text-xs">
                              上传时间: {new Date(doc.createdAt || '').toLocaleString()}
                            </Text>
                            {doc.embeddingUpdatedAt && (
                              <Text type="secondary" className="text-xs">
                                索引时间: {new Date(doc.embeddingUpdatedAt).toLocaleString()}
                              </Text>
                            )}
                            {doc.content && (
                              <Paragraph ellipsis={{ rows: 2 }} className="text-gray-500 text-sm mb-0">
                                {doc.content.substring(0, 100)}...
                              </Paragraph>
                            )}
                          </Space>
                        }
                      />
                    </Card>
                  </Col>
                );
              })}
            </Row>
            
            {filteredDocuments.length === 0 && (
              <Empty description="暂无文档" />
            )}
          </Card>
        </Col>
      </Row>

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
          <Space direction="vertical" className="w-full">
            <Space>
              <Tag color={getTypeLabel(currentDoc.sourceType).color as any}>
                {getTypeLabel(currentDoc.sourceType).text}
              </Tag>
              {currentDoc.embedding ? (
                <Badge status="success" text="已索引" />
              ) : (
                <Badge status="default" text="未索引" />
              )}
            </Space>
            <Text type="secondary">
              上传时间: {new Date(currentDoc.createdAt || '').toLocaleString()}
            </Text>
            <div className="bg-gray-50 p-4 rounded max-h-[400px] overflow-auto">
              <pre className="whitespace-pre-wrap text-sm">
                {currentDoc.content || '无内容'}
              </pre>
            </div>
          </Space>
        )}
      </Modal>

      {/* RAG 智能检索弹窗 */}
      <Modal
        title={
          <Space>
            <RobotOutlined />
            <span>智能检索 (RAG)</span>
          </Space>
        }
        open={ragModalVisible}
        onCancel={() => setRagModalVisible(false)}
        footer={null}
        width={900}
      >
        <Space direction="vertical" className="w-full" size="large">
          {/* 搜索配置 */}
          <Card size="small">
            <Space className="w-full" align="start">
              <Select
                value={ragMode}
                onChange={setRagMode}
                style={{ width: 150 }}
                options={[
                  { value: 'vector', label: '向量检索 (Dense)' },
                  { value: 'keyword', label: '关键词检索 (Sparse)' },
                  { value: 'hybrid', label: '混合检索 (RRF融合)' },
                ]}
              />
              <Search
                placeholder="输入问题或关键词进行智能检索..."
                value={ragQuery}
                onChange={(e) => setRagQuery(e.target.value)}
                onSearch={handleRagSearch}
                loading={ragLoading}
                enterButton
                style={{ flex: 1 }}
              />
            </Space>
          </Card>

          {/* 检索说明 */}
          <div className="bg-blue-50 p-3 rounded text-sm text-gray-600">
            {ragMode === 'vector' && '向量检索：基于语义相似度，适合概念性、描述性问题'}
            {ragMode === 'keyword' && '关键词检索：基于关键词匹配，适合精确查找'}
            {ragMode === 'hybrid' && '混合检索：结合向量语义和关键词匹配，效果最佳'}
          </div>

          {/* 检索结果 */}
          {ragLoading ? (
            <div className="text-center py-8">
              <Spin size="large" />
              <p className="mt-2 text-gray-500">正在检索知识库...</p>
            </div>
          ) : (
            <List
              dataSource={ragResults}
              renderItem={(item) => (
                <List.Item>
                  <Card size="small" className="w-full">
                    <Space direction="vertical" className="w-full">
                      <Space className="w-full justify-between">
                        <Space>
                          <FileTextOutlined />
                          <Text strong>{item.title}</Text>
                          <Tag color={
                            item.sourceType === 'interview_notes' ? 'orange' :
                            item.sourceType === 'question_bank' ? 'blue' : 'green'
                          }>
                            {getTypeLabel(item.sourceType).text}
                          </Tag>
                          <Tag color="blue">{item.searchType}</Tag>
                        </Space>
                        <Badge 
                          count={`${(item.score * 100).toFixed(1)}%`} 
                          style={{ 
                            backgroundColor: item.score > 0.8 ? '#52c41a' : 
                                            item.score > 0.5 ? '#1890ff' : '#faad14' 
                          }} 
                        />
                      </Space>
                      <Paragraph ellipsis={{ rows: 3 }} className="text-gray-600 mb-0">
                        {item.content}
                      </Paragraph>
                    </Space>
                  </Card>
                </List.Item>
              )}
              locale={{ emptyText: '请输入查询内容进行检索' }}
            />
          )}
        </Space>
      </Modal>
    </div>
  );
}
