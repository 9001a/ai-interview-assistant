'use client';

import { useState } from 'react';
import {
  Card,
  Form,
  Input,
  Button,
  Typography,
  Tabs,
  Spin,
  Row,
  Col,
  Alert,
  Space,
  message,
} from 'antd';
import { FileTextOutlined, CheckCircleOutlined, ThunderboltOutlined, RocketOutlined } from '@ant-design/icons';
import { useInterviewStore } from '@/stores/interviewStore';
import { useAuthStore } from '@/stores/authStore';
import { jdApi } from '@/services/api';

const { Title, Text } = Typography;
const { TextArea } = Input;

const JD_TAB_ITEMS = [
  {
    key: 'overview',
    label: (
      <span>
        <FileTextOutlined /> 岗位概述
      </span>
    ),
  },
  {
    key: 'requirements',
    label: (
      <span>
        <CheckCircleOutlined /> 隐含要求
      </span>
    ),
  },
  {
    key: 'daily',
    label: (
      <span>
        <ThunderboltOutlined /> 日常工作
      </span>
    ),
  },
  {
    key: 'prospects',
    label: (
      <span>
        <RocketOutlined /> 发展前景
      </span>
    ),
  },
];

export default function JDPage() {
  const [loading, setLoading] = useState(false);
  const [analysis, setAnalysis] = useState<Record<string, string> | null>(null);
  const { setJDAnalysis, jdAnalysis } = useInterviewStore();
  const { user } = useAuthStore();

  // 模拟 JD 分析
  const handleAnalyze = async (values: { jdText: string }) => {
    if (!values.jdText.trim()) {
      message.warning('请输入岗位描述');
      return;
    }

    setLoading(true);
    try {
      const res = await jdApi.analyze(values.jdText);
      console.log('API Response:', res); // 调试用
      
      // 处理两种可能的返回格式
      const analysisData = res.analysis || res;
      
      if (analysisData && (analysisData.overview || analysisData.requirements)) {
        setAnalysis(analysisData);
        setJDAnalysis(values.jdText, analysisData);
        message.success('分析完成！');
      } else {
        console.error('Invalid response format:', res);
        message.error('返回数据格式错误');
      }
    } catch (error: any) {
      console.error('API Error:', error);
      message.error(error.response?.data?.error || '分析失败');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6">
      <Row gutter={[24, 24]}>
        {/* 左侧：JD 输入 */}
        <Col xs={24} lg={12}>
          <Card 
            title="📄 岗位描述 (JD)" 
            className="h-full"
            styles={{ header: { backgroundColor: '#FFF8E7' } }}
          >
            <Form
              name="jd_analysis"
              onFinish={handleAnalyze}
              layout="vertical"
              initialValues={{ jdText: jdAnalysis?.text || '' }}
            >
              <Form.Item
                name="jdText"
                label="请粘贴岗位描述"
                rules={[
                  { required: true, message: '请输入岗位描述' },
                  () => ({
                    validator(_, value) {
                      if (!value || value.trim().length < 20) {
                        return Promise.reject(new Error('请输入有效的岗位描述（至少20个字）'));
                      }
                      return Promise.resolve();
                    },
                  }),
                ]}
              >
                {({ getValueFromEvent }) => (
                  <TextArea
                    rows={16}
                    placeholder="从招聘网站复制粘贴岗位描述到这里..."
                    showCount
                    maxLength={10000}
                    style={{ fontFamily: 'inherit', fontSize: '14px' }}
                    onChange={(e) => getValueFromEvent?.(e.target.value)}
                  />
                )}
                <TextArea
                  rows={16}
                  placeholder="从招聘网站复制粘贴岗位描述到这里..."
                  showCount
                  maxLength={10000}
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
                  icon={<ThunderboltOutlined />}
                >
                  {loading ? '正在分析...' : '开始分析'}
                </Button>
              </Form.Item>
            </Form>

            <Alert
              title="💡 提示"
              description="AI 会从四个维度分析岗位描述，帮助你更好地理解这个岗位"
              type="info"
              showIcon
            />
          </Card>
        </Col>

        {/* 右侧：分析结果 */}
        <Col xs={24} lg={12}>
          <Card
            title="📊 分析结果"
            className="h-full"
            styles={{ header: { backgroundColor: '#FFF8E7' } }}
          >
            {loading ? (
              <div className="text-center py-16">
                <Spin size="large" description="AI 正在分析中，请稍候..." />
                <div className="mt-4 text-gray-500">
                  正在从四个维度深入分析...
                </div>
              </div>
            ) : (
              <Tabs
                defaultActiveKey="overview"
                className="warm-tabs"
                items={JD_TAB_ITEMS.map((item) => ({
                  ...item,
                  children: analysis || jdAnalysis?.analysis ? (
                    <div className="whitespace-pre-wrap p-4 bg-amber-50 rounded-lg">
                      {(analysis || jdAnalysis?.analysis)?.[item.key] || '暂无内容'}
                    </div>
                  ) : (
                    <div className="text-center py-16">
                      <div className="text-4xl mb-4">📝</div>
                      <Text type="secondary">请先粘贴岗位描述并点击分析</Text>
                    </div>
                  ),
                }))}
              />
            )}
          </Card>
        </Col>
      </Row>

      {analysis && (
        <div className="mt-6 flex justify-center">
          <Space size="large">
            <Button
              type="primary"
              size="large"
              style={{
                backgroundColor: '#F5A623',
                borderColor: '#F5A623',
              }}
              onClick={() => {
                // TODO: 跳转到简历页面
                message.info('继续功能开发中...');
              }}
            >
              继续：上传简历 →
            </Button>
          </Space>
        </div>
      )}
    </div>
  );
}
