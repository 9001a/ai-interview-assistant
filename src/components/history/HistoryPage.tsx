'use client';

import { useState } from 'react';
import { Card, Typography, Tag, Button, Space, Input, Select, message } from 'antd';
import { HistoryOutlined, SearchOutlined, CalendarOutlined } from '@ant-design/icons';
import { useHistoryStore } from '@/stores/historyStore';
import type { HistoryRecordType, HistoryRecord } from '@/types';

const { Title, Text } = Typography;
const { Option } = Select;

export default function HistoryPage() {
  const [searchText, setSearchText] = useState('');
  const [filterType, setFilterType] = useState<'all' | HistoryRecordType>('all');
  const [filterSource, setFilterSource] = useState<'all' | 'workspace' | 'quick'>('all');
  
  const historyRecords = useHistoryStore((state) => state.records);
  const removeRecord = useHistoryStore((state) => state.removeRecord);

  const getRecordTypeLabel = (type: HistoryRecordType) => {
    const labels: Record<HistoryRecordType, string> = {
      jd_analysis: 'JD分析',
      resume_optimization: '简历优化',
      interview: '面试',
    };
    return labels[type] || type;
  };

  const getRecordTypeColor = (type: HistoryRecordType) => {
    const colors: Record<HistoryRecordType, string> = {
      jd_analysis: 'blue',
      resume_optimization: 'green',
      interview: 'orange',
    };
    return colors[type] || 'default';
  };

  const getStatusColor = (status?: string) => {
    return status === 'completed' ? 'success' : 'processing';
  };

  const getScoreColor = (score?: number) => {
    if (!score) return '#8B7355';
    if (score >= 90) return '#52C41A';
    if (score >= 80) return '#F5A623';
    return '#FF6B6B';
  };

  const getRecordIcon = (type: HistoryRecordType) => {
    const icons: Record<HistoryRecordType, string> = {
      jd_analysis: '📋',
      resume_optimization: '📄',
      interview: '💬',
    };
    return icons[type] || '📌';
  };

  const handleViewChat = (record: HistoryRecord) => {
    message.info('查看对话功能开发中');
  };

  const handleContinueInterview = (record: HistoryRecord) => {
    message.info('继续面试功能开发中');
  };

  const handleViewDetails = (record: HistoryRecord) => {
    message.info('查看详情功能开发中');
  };

  const handleViewReport = (record: HistoryRecord) => {
    message.info('查看报告功能开发中');
  };

  // 筛选逻辑
  const filteredRecords = historyRecords.filter((record) => {
    // 搜索过滤
    const matchesSearch = searchText === '' || 
      record.title.toLowerCase().includes(searchText.toLowerCase()) ||
      (record.workspaceName?.toLowerCase().includes(searchText.toLowerCase()));
    
    // 类型过滤
    const matchesType = filterType === 'all' || record.type === filterType;
    
    // 来源过滤
    const matchesSource = filterSource === 'all' || record.source === filterSource;
    
    return matchesSearch && matchesType && matchesSource;
  });

  return (
    <div style={{ padding: '24px' }}>
      <Card
        styles={{
          header: { backgroundColor: '#FFFBF5', borderBottom: '1px solid #E8DFD0' },
          body: { backgroundColor: '#FFF8E7' },
        }}
        title={
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <HistoryOutlined style={{ color: '#F5A623', fontSize: 20 }} />
            <Title level={4} style={{ margin: 0, color: '#5C4A32' }}>
              历史记录
            </Title>
            <Text type="secondary" style={{ marginLeft: 'auto' }}>
              共 {historyRecords.length} 条记录
            </Text>
          </div>
        }
      >
        <div style={{ marginBottom: 24, display: 'flex', gap: 16, flexWrap: 'wrap' }}>
          <Input
            prefix={<SearchOutlined style={{ color: '#8B7355' }} />}
            placeholder="搜索标题或工作区..."
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            style={{ width: 280 }}
          />
          <Select
            value={filterType}
            onChange={setFilterType}
            style={{ width: 150 }}
            placeholder="选择类型"
          >
            <Option value="all">全部类型</Option>
            <Option value="jd_analysis">JD分析</Option>
            <Option value="resume_optimization">简历优化</Option>
            <Option value="interview">面试</Option>
          </Select>
          <Select
            value={filterSource}
            onChange={setFilterSource}
            style={{ width: 150 }}
            placeholder="选择来源"
          >
            <Option value="all">全部来源</Option>
            <Option value="workspace">工作区</Option>
            <Option value="quick">快速记录</Option>
          </Select>
        </div>

        {filteredRecords.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '48px 0', color: '#8B7355' }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>📭</div>
            <Text type="secondary">暂无历史记录</Text>
          </div>
        ) : (
          <Space direction="vertical" style={{ width: '100%' }} size="middle">
            {filteredRecords.map((record) => (
              <Card
                key={record.id}
                size="small"
                styles={{ body: { padding: 16 } }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div style={{ display: 'flex', gap: 16, flex: 1 }}>
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
                      {getRecordIcon(record.type)}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8, flexWrap: 'wrap' }}>
                        <Text strong style={{ fontSize: 16, color: '#5C4A32' }}>
                          {record.title}
                        </Text>
                        <Tag color={getRecordTypeColor(record.type)}>
                          {getRecordTypeLabel(record.type)}
                        </Tag>
                        {record.source === 'workspace' && (
                          <Tag color="purple">
                            工作区: {record.workspaceName}
                          </Tag>
                        )}
                        {record.status && (
                          <Tag color={getStatusColor(record.status)}>
                            {record.status === 'completed' ? '已完成' : '进行中'}
                          </Tag>
                        )}
                      </div>
                      <Space wrap size="small">
                        <Text type="secondary">
                          <CalendarOutlined style={{ marginRight: 4 }} />
                          {new Date(record.createdAt).toLocaleDateString('zh-CN')}
                        </Text>
                        {record.turns && (
                          <Text type="secondary">面试轮数: {record.turns}</Text>
                        )}
                        {record.score !== undefined && (
                          <Text style={{ color: getScoreColor(record.score), fontWeight: 'bold' }}>
                            评分: {record.score}
                          </Text>
                        )}
                      </Space>
                    </div>
                  </div>
                  <Space size="small">
                    {record.type === 'interview' && (
                      <>
                        <Button type="link" size="small" onClick={() => handleViewChat(record)}>查看对话</Button>
                        {record.status !== 'completed' && (
                          <Button type="link" size="small" onClick={() => handleContinueInterview(record)}>继续面试</Button>
                        )}
                      </>
                    )}
                    {record.type === 'jd_analysis' && (
                      <Button type="link" size="small" onClick={() => handleViewDetails(record)}>查看详情</Button>
                    )}
                    {record.type === 'resume_optimization' && (
                      <Button type="link" size="small" onClick={() => handleViewReport(record)}>查看报告</Button>
                    )}
                    <Button 
                      type="link" 
                      size="small" 
                      danger
                      onClick={() => removeRecord(record.id)}
                    >
                      删除
                    </Button>
                  </Space>
                </div>
              </Card>
            ))}
          </Space>
        )}
      </Card>
    </div>
  );
}
