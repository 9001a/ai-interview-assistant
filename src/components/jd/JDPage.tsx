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
import {
  FileTextOutlined,
  CheckCircleOutlined,
  ThunderboltOutlined,
  RocketOutlined,
  BuildOutlined,
  DollarOutlined,
  QuestionCircleOutlined,
} from '@ant-design/icons';
import { useInterviewStore } from '@/stores/interviewStore';
import { useAuthStore } from '@/stores/authStore';
import { useJDStore } from '@/stores/jdStore';
import { jdApi } from '@/services/api';
import { JDAnalysisResult } from '@/lib/openai';
import { JDAnalysis } from '@/types';

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
    key: 'daily',
    label: (
      <span>
        <ThunderboltOutlined /> 日常工作
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
    key: 'prospects',
    label: (
      <span>
        <RocketOutlined /> 发展前景
      </span>
    ),
  },
  {
    key: 'company',
    label: (
      <span>
        <BuildOutlined /> 公司背景
      </span>
    ),
  },
  {
    key: 'salary',
    label: (
      <span>
        <DollarOutlined /> 薪资分析
      </span>
    ),
  },
  {
    key: 'interview',
    label: (
      <span>
        <QuestionCircleOutlined /> 面试重点
      </span>
    ),
  },
];  // 技能标签用单独的 Tag 组件显示，不在 Tab 中展示

export default function JDPage() {
  const [loading, setLoading] = useState(false);
  const [analysis, setAnalysis] = useState<JDAnalysisResult['summary'] | null>(null);
  const [tags, setTags] = useState<string[]>([]);
  const { setJDAnalysis, jdAnalysis, jdAnalyzerConfig } = useInterviewStore();
  const { addJD } = useJDStore();
  const { user } = useAuthStore();

  const handleAnalyze = async (values: { jdText: string }) => {
    if (!values.jdText.trim()) {
      message.warning('请输入岗位描述');
      return;
    }

    setLoading(true);
    try {
      const result = await jdApi.analyze(values.jdText, jdAnalyzerConfig);
      console.log('Analysis Result:', result);

      if (result.success && result.data && result.data.summary) {
        setAnalysis(result.data.summary);
        setTags(result.data.skillTags || []);
        
        // 保存到全局 JD Store
        const jdAnalysisData: JDAnalysis = {
          id: `jd_${Date.now()}`,
          userId: user?.id || 'guest',
          originalText: values.jdText,
          summary: result.data.summary,
          skillTags: result.data.skillTags || [],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        
        // 立即保存到全局库
        addJD(jdAnalysisData);
        console.log('✅ JD 已保存到全局库:', jdAnalysisData.id);
        
        message.success('✅ 分析完成！已自动保存到"JD和简历"库');
      } else {
        message.error('返回数据格式错误');
      }
    } catch (error: any) {
      console.error('Analysis Error:', error);
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
            >
              <Form.Item
                name="jdText"
                label="请粘贴岗位描述"
                rules={[
                  { required: true, message: '请输入岗位描述' },
                ]}
              >
                <TextArea
                  rows={12}
                  placeholder="在此粘贴 JD 内容..."
                  disabled={loading}
                />
              </Form.Item>

              <Form.Item>
                <Button
                  type="primary"
                  htmlType="submit"
                  loading={loading}
                  block
                  size="large"
                  className="bg-[#F5A623] hover:bg-[#FF9500] border-none"
                >
                  {loading ? '分析中...' : '开始分析'}
                </Button>
              </Form.Item>
            </Form>

            {tags.length > 0 && (
              <div className="mt-4">
                <Text strong>技能标签：</Text>
                <div className="mt-2">
                  {tags.map((tag, index) => (
                    <span
                      key={index}
                      className="inline-block bg-[#F5A623] text-white px-2 py-1 rounded text-sm mr-2 mb-2"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            )}
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
              <div className="text-center py-12">
                <Spin size="large" />
                <div className="mt-4 text-gray-500">正在深度分析 JD...</div>
              </div>
            ) : analysis ? (
              <Tabs
                defaultActiveKey="overview"
                items={JD_TAB_ITEMS.map((item) => ({
                  key: item.key,
                  label: item.label,
                  children: (
                    <div className="p-4 bg-[#FFFBF5] rounded-lg min-h-[200px]">
                      <div className="whitespace-pre-wrap leading-relaxed text-gray-700">
                        {item.key === 'overview' && analysis.jobOverview}
                        {item.key === 'daily' && analysis.dailyWork}
                        {item.key === 'requirements' && analysis.implicitRequirements}
                        {item.key === 'prospects' && analysis.developmentProspect}
                        {item.key === 'company' && analysis.companyBackground}
                        {item.key === 'salary' && analysis.salaryAnalysis}
                        {item.key === 'interview' && analysis.interviewFocus}
                      </div>
                    </div>
                  ),
                }))}
              />
            ) : (
              <div className="text-center py-12 text-gray-400">
                <FileTextOutlined style={{ fontSize: 48 }} className="mb-4" />
                <div>在左侧输入 JD 内容，开始深度分析</div>
              </div>
            )}
          </Card>
        </Col>
      </Row>

      {/* 使用提示 */}
      <Alert
        title="💡 使用提示"
        description="建议在「工作区」中进行 JD 分析，可以更好地管理多个 JD 并进行简历优化。"
        type="info"
        showIcon
        className="mt-6"
      />
    </div>
  );
}
