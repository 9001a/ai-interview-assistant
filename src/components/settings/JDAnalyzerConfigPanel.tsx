'use client';

import React, { useState } from 'react';
import {
  Tabs,
  Card,
  Row,
  Col,
  Button,
  Tag,
  Space,
  Typography,
  Alert,
  Switch,
  Slider,
  Select,
  Input,
  InputNumber,
  Modal,
  Form,
  Descriptions,
  Empty,
  Tooltip,
  List,
  Divider,
} from 'antd';
import type { JDAnalyzerConfig, JDAnalyzerPreset } from '@/types';
import { useInterviewStore } from '@/stores/interviewStore';
import {
  FileTextOutlined,
  SettingOutlined,
  EditOutlined,
  EyeOutlined,
  CheckOutlined,
  PlusOutlined,
  DeleteOutlined,
  CopyOutlined,
  DatabaseOutlined,
  AppstoreOutlined,
  CodeOutlined,
} from '@ant-design/icons';

const { Title, Text, Paragraph } = Typography;
const { TextArea } = Input;

// 分析维度配置
const ANALYSIS_DIMENSIONS = [
  { key: 'jobOverview', label: '岗位概述', desc: '分析岗位职责和核心价值' },
  { key: 'dailyWork', label: '日常工作', desc: '了解日常工作内容和流程' },
  { key: 'implicitRequirements', label: '隐含要求', desc: '挖掘JD中未明确说明的要求' },
  { key: 'developmentProspect', label: '发展前景', desc: '分析岗位的成长空间' },
  { key: 'skillTags', label: '技能标签', desc: '提取核心技术技能标签' },
  { key: 'companyBackground', label: '公司背景', desc: '分析公司规模和行业地位' },
  { key: 'salaryAnalysis', label: '薪资分析', desc: '根据JD分析薪资水平' },
  { key: 'interviewFocus', label: '面试重点', desc: '预测面试可能考察的内容' },
];

// 默认 System Prompt 模板
const DEFAULT_SYSTEM_PROMPT = `你是一位专业的 JD（职位描述）分析专家，擅长从招聘信息中提取关键信息并进行深度分析。

分析维度：
{{analysis_dimensions}}

分析要求：
1. 对每个维度进行深入分析，给出具体、实用的见解
2. 技能标签需要准确、具体，便于候选人对照准备
3. 隐含要求要从字里行间挖掘，帮助候选人了解真实的用人标准
4. 面试重点要结合岗位特点，给出针对性的准备建议

输出格式：
请严格按照以下格式输出分析结果：

**岗位概述**：
[简要说明岗位的核心职责和价值]

**日常工作**：
[描述日常具体工作内容和流程]

**隐含要求**：
[挖掘JD中未明确但实际需要的技能和经验]

**发展前景**：
[分析该岗位的职业成长路径]

**技能标签**：
[列出 {{tag_count}} 个核心技能标签，用顿号分隔]

**面试重点**：
[预测面试可能重点考察的能力和知识点]

待分析JD：
{{jd_text}}`;

export function JDAnalyzerConfigPanel() {
  const {
    jdAnalyzerConfig,
    jdAnalyzerPresets,
    activeJDAnalyzerPresetId,
    setJDAnalyzerConfig,
    addJDAnalyzerPreset,
    deleteJDAnalyzerPreset,
    loadJDAnalyzerPreset,
  } = useInterviewStore();

  const [activeTab, setActiveTab] = useState('presets');
  const [viewingPreset, setViewingPreset] = useState<JDAnalyzerPreset | null>(null);
  const [isSaveModalOpen, setIsSaveModalOpen] = useState(false);
  const [saveForm] = Form.useForm();

  // 自由描述相关状态
  const [description, setDescription] = useState('');
  const [generatedPrompt, setGeneratedPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);

  // 获取当前配置对应的预设
  const getCurrentPreset = (): JDAnalyzerPreset | undefined => {
    if (!activeJDAnalyzerPresetId) return undefined;
    return jdAnalyzerPresets.find((p) => p.id === activeJDAnalyzerPresetId);
  };

  // 根据描述生成 Prompt
  const generatePromptFromDescription = async () => {
    if (!description.trim()) return;

    setIsGenerating(true);
    try {
      // 根据描述生成 System Prompt（模拟 AI 生成）
      const styleMap: Record<string, string> = {
        detailed: '详细深入',
        concise: '简洁明了',
        professional: '专业严谨',
      };

      const enabledDimensions = ANALYSIS_DIMENSIONS.filter(
        (dim) => jdAnalyzerConfig.dimensions[dim.key as keyof typeof jdAnalyzerConfig.dimensions]
      );

      const dimensionsText = enabledDimensions.map((d) => d.label).join('、');

      const generated = `你是一位专业的 JD（职位描述）分析专家。${description}

分析维度：
${enabledDimensions.map((d) => `- ${d.label}：${d.desc}`).join('\n')}

分析要求：
1. 分析风格：${styleMap[jdAnalyzerConfig.style] || '详细'}
2. 输出语言：${jdAnalyzerConfig.language === 'zh' ? '中文' : 'English'}
3. 提取 ${jdAnalyzerConfig.tagCount} 个核心技能标签
4. ${description.includes('技术') ? '重点关注技术栈和项目经验' : ''}
5. ${description.includes('管理') ? '关注团队管理能力和业务视野' : ''}

输出格式：
请严格按照以下格式输出分析结果：

${enabledDimensions.map((d) => `**${d.label}**：\n[分析内容]\n`).join('\n')}

**技能标签**：
[列出 {{tag_count}} 个核心技能标签，用顿号分隔]

待分析JD：
{{jd_text}}`;

      setGeneratedPrompt(generated);
    } catch (error) {
      console.error('生成 Prompt 失败:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  // 渲染配置模板库 Tab
  const renderPresetsTab = () => (
    <Space direction="vertical" style={{ width: '100%' }} size="large">
      <Alert
        type="info"
        showIcon
        message="配置模板库"
        description="选择或保存分析模板。系统预设提供常用场景，你也可以保存自定义配置。"
      />

      {/* 系统预设 */}
      <Card
        type="inner"
        title={
          <Space>
            <AppstoreOutlined />
            <span>系统预设</span>
          </Space>
        }
      >
        <Row gutter={[16, 16]}>
          {jdAnalyzerPresets
            .filter((p) => p.isBuiltIn)
            .map((preset) => (
              <Col span={8} key={preset.id}>
                <Card
                  size="small"
                  hoverable
                  style={{
                    borderColor:
                      activeJDAnalyzerPresetId === preset.id ? '#1890ff' : undefined,
                  }}
                  title={
                    <Space>
                      <DatabaseOutlined />
                      <Text strong>{preset.name}</Text>
                      {activeJDAnalyzerPresetId === preset.id && (
                        <Tag color="blue">当前使用</Tag>
                      )}
                    </Space>
                  }
                  actions={[
                    <Tooltip title="查看详情" key="view">
                      <Button
                        type="text"
                        icon={<EyeOutlined />}
                        onClick={() => setViewingPreset(preset)}
                      />
                    </Tooltip>,
                    <Tooltip title="加载此模板" key="load">
                      <Button
                        type="text"
                        icon={<CheckOutlined />}
                        onClick={() => loadJDAnalyzerPreset(preset.id)}
                      />
                    </Tooltip>,
                  ]}
                >
                  <Text type="secondary" style={{ fontSize: 12 }}>
                    {preset.description}
                  </Text>
                </Card>
              </Col>
            ))}
        </Row>
      </Card>

      {/* 我的模板 */}
      <Card
        type="inner"
        title={
          <Space>
            <FileTextOutlined />
            <span>我的模板</span>
          </Space>
        }
        extra={
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => setIsSaveModalOpen(true)}
          >
            保存当前配置为新模板
          </Button>
        }
      >
        {jdAnalyzerPresets.filter((p) => !p.isBuiltIn).length === 0 ? (
          <Empty description="暂无自定义模板" />
        ) : (
          <List
            dataSource={jdAnalyzerPresets.filter((p) => !p.isBuiltIn)}
            renderItem={(preset) => (
              <List.Item
                actions={[
                  <Button
                    key="view"
                    type="text"
                    icon={<EyeOutlined />}
                    onClick={() => setViewingPreset(preset)}
                  >
                    查看
                  </Button>,
                  <Button
                    key="load"
                    type="text"
                    icon={<CheckOutlined />}
                    onClick={() => loadJDAnalyzerPreset(preset.id)}
                  >
                    加载
                  </Button>,
                  <Button
                    key="delete"
                    type="text"
                    danger
                    icon={<DeleteOutlined />}
                    onClick={() => deleteJDAnalyzerPreset(preset.id)}
                  >
                    删除
                  </Button>,
                ]}
              >
                <List.Item.Meta
                  title={
                    <Space>
                      <Text strong>{preset.name}</Text>
                      {activeJDAnalyzerPresetId === preset.id && (
                        <Tag color="blue">当前使用</Tag>
                      )}
                    </Space>
                  }
                  description={preset.description}
                />
              </List.Item>
            )}
          />
        )}
      </Card>
    </Space>
  );

  // 渲染分析维度 Tab
  const renderDimensionsTab = () => (
    <Space direction="vertical" style={{ width: '100%' }} size="large">
      <Alert
        type="info"
        showIcon
        message="分析维度配置"
        description="开启或关闭各个分析维度。开启的维度会在分析结果中呈现。"
      />

      <Card type="inner" title="分析维度开关">
        <Row gutter={[16, 16]}>
          {ANALYSIS_DIMENSIONS.map((dim) => (
            <Col span={12} key={dim.key}>
              <Card size="small">
                <Space direction="vertical" style={{ width: '100%' }}>
                  <Space style={{ justifyContent: 'space-between', width: '100%' }}>
                    <Text strong>{dim.label}</Text>
                    <Switch
                      checked={jdAnalyzerConfig.dimensions[dim.key as keyof typeof jdAnalyzerConfig.dimensions]}
                      onChange={(checked) =>
                        setJDAnalyzerConfig({
                          dimensions: {
                            ...jdAnalyzerConfig.dimensions,
                            [dim.key]: checked,
                          },
                        })
                      }
                    />
                  </Space>
                  <Text type="secondary" style={{ fontSize: 12 }}>
                    {dim.desc}
                  </Text>
                </Space>
              </Card>
            </Col>
          ))}
        </Row>
      </Card>

      <Card type="inner" title="其他设置">
        <Space direction="vertical" style={{ width: '100%' }}>
          <div>
            <Text strong>分析风格</Text>
            <Select
              style={{ width: '100%', marginTop: 8 }}
              value={jdAnalyzerConfig.style}
              onChange={(value) => setJDAnalyzerConfig({ style: value })}
              options={[
                { label: '详细', value: 'detailed', description: '全面深入的分析' },
                { label: '简洁', value: 'concise', description: '简明扼要的要点' },
                { label: '专业', value: 'professional', description: '专业术语和分析框架' },
              ]}
            />
          </div>

          <div>
            <Text strong>语言</Text>
            <Select
              style={{ width: '100%', marginTop: 8 }}
              value={jdAnalyzerConfig.language}
              onChange={(value) => setJDAnalyzerConfig({ language: value })}
              options={[
                { label: '中文', value: 'zh' },
                { label: 'English', value: 'en' },
              ]}
            />
          </div>

          <div>
            <Text strong>技能标签数量</Text>
            <InputNumber
              style={{ width: '100%', marginTop: 8 }}
              min={3}
              max={15}
              value={jdAnalyzerConfig.tagCount}
              onChange={(value) => setJDAnalyzerConfig({ tagCount: value || 5 })}
            />
          </div>
        </Space>
      </Card>
    </Space>
  );

  // 渲染自由描述 Tab
  const renderDescriptionTab = () => (
    <Space direction="vertical" style={{ width: '100%' }} size="large">
      <Alert
        type="warning"
        showIcon
        message="自由描述"
        description="用文字描述您期望的 JD 分析风格，系统会为您生成对应的 System Prompt。这将覆盖当前已有的 Prompt。"
      />

      <Card type="inner" title="描述您的期望">
        <Space direction="vertical" style={{ width: '100%' }}>
          <TextArea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={6}
            placeholder="例如：我希望分析重点关注技术栈匹配度，对于后端岗位需要深入分析分布式系统经验，对于前端岗位关注组件化设计能力..."
          />
          <Button
            type="primary"
            onClick={generatePromptFromDescription}
            loading={isGenerating}
            disabled={!description.trim()}
            block
          >
            生成 Prompt
          </Button>
        </Space>
      </Card>

      {generatedPrompt && (
        <Card
          type="inner"
          title="生成的 System Prompt"
          extra={
            <Space>
              <Button
                size="small"
                onClick={() => {
                  setJDAnalyzerConfig({ systemPrompt: generatedPrompt });
                  setActiveTab('prompt');
                }}
              >
                应用到 Prompt编辑
              </Button>
              <Button
                type="primary"
                size="small"
                icon={<CopyOutlined />}
                onClick={() => {
                  navigator.clipboard.writeText(generatedPrompt);
                }}
              >
                复制
              </Button>
            </Space>
          }
        >
          <pre
            style={{
              backgroundColor: '#f5f5f5',
              padding: 12,
              borderRadius: 4,
              maxHeight: 400,
              overflow: 'auto',
              fontFamily: 'monospace',
              fontSize: 13,
              margin: 0,
            }}
          >
            {generatedPrompt}
          </pre>
        </Card>
      )}
    </Space>
  );

  // 渲染 Prompt编辑 Tab
  const renderPromptEditTab = () => (
    <Space direction="vertical" style={{ width: '100%' }} size="large">
      <Alert
        type="warning"
        showIcon
        message="Prompt 编辑"
        description="这是最终生效的 System Prompt，直接编辑即可生效。支持使用变量：{{analysis_dimensions}}、{{tag_count}}、{{jd_text}}"
      />

      <Card
        type="inner"
        title={
          <Space>
            <CodeOutlined />
            <span>System Prompt</span>
          </Space>
        }
        extra={
          <Space>
            <Button
              size="small"
              onClick={() => setJDAnalyzerConfig({ systemPrompt: DEFAULT_SYSTEM_PROMPT })}
            >
              恢复默认
            </Button>
            <Button
              type="primary"
              size="small"
              icon={<CopyOutlined />}
              onClick={() => {
                navigator.clipboard.writeText(jdAnalyzerConfig.systemPrompt || DEFAULT_SYSTEM_PROMPT);
                // message.success('已复制到剪贴板');
              }}
            >
              复制
            </Button>
          </Space>
        }
      >
        <TextArea
          value={jdAnalyzerConfig.systemPrompt || DEFAULT_SYSTEM_PROMPT}
          onChange={(e) => setJDAnalyzerConfig({ systemPrompt: e.target.value })}
          rows={25}
          style={{ fontFamily: 'monospace', fontSize: 13 }}
          placeholder="输入自定义的 System Prompt..."
        />
      </Card>

      <Card type="inner" title="可用变量">
        <Space direction="vertical">
          <Text code>{'{{analysis_dimensions}}'}</Text>
          <Text type="secondary">要分析的维度列表（根据开关自动生成）</Text>
          <Divider style={{ margin: '8px 0' }} />
          <Text code>{'{{tag_count}}'}</Text>
          <Text type="secondary">技能标签数量</Text>
          <Divider style={{ margin: '8px 0' }} />
          <Text code>{'{{jd_text}}'}</Text>
          <Text type="secondary">要分析的 JD 原文</Text>
        </Space>
      </Card>
    </Space>
  );

  // 渲染查看预设详情的 Modal
  const renderPresetModal = () => {
    if (!viewingPreset) return null;
    const config = viewingPreset.config;

    // 计算启用的维度数量
    const enabledDimensions = Object.entries(config.dimensions).filter(
      ([_, enabled]) => enabled
    );

    return (
      <Modal
        title={
          <Space>
            <EyeOutlined />
            <span>模板详情</span>
          </Space>
        }
        open={!!viewingPreset}
        onCancel={() => setViewingPreset(null)}
        width={700}
        footer={[
          <Button key="close" onClick={() => setViewingPreset(null)}>
            关闭
          </Button>,
          <Button
            key="load"
            type="primary"
            icon={<CheckOutlined />}
            onClick={() => {
              loadJDAnalyzerPreset(viewingPreset.id);
              setViewingPreset(null);
            }}
          >
            加载此模板
          </Button>,
        ]}
      >
        <Space direction="vertical" style={{ width: '100%' }} size="large">
          {/* 基本信息 */}
          <Card size="small" title="基本信息">
            <Descriptions column={2} size="small">
              <Descriptions.Item label="名称">{viewingPreset.name}</Descriptions.Item>
              <Descriptions.Item label="类型">
                {viewingPreset.isBuiltIn ? (
                  <Tag color="blue">系统预设</Tag>
                ) : (
                  <Tag color="green">自定义</Tag>
                )}
              </Descriptions.Item>
              <Descriptions.Item label="描述" span={2}>
                {viewingPreset.description}
              </Descriptions.Item>
            </Descriptions>
          </Card>

          {/* 分析维度 */}
          <Card size="small" title="分析维度">
            <Row gutter={[8, 8]}>
              {ANALYSIS_DIMENSIONS.map((dim) => {
                const enabled = config.dimensions[dim.key as keyof typeof config.dimensions];
                return (
                  <Col span={12} key={dim.key}>
                    <Space>
                      <Tag color={enabled ? 'green' : 'default'}>
                        {enabled ? '✓' : '✗'}
                      </Tag>
                      <Text>{dim.label}</Text>
                    </Space>
                  </Col>
                );
              })}
            </Row>
          </Card>

          {/* 其他配置 */}
          <Card size="small" title="其他配置">
            <Descriptions column={3} size="small">
              <Descriptions.Item label="分析风格">
                {config.style === 'detailed' ? '详细' : config.style === 'concise' ? '简洁' : '专业'}
              </Descriptions.Item>
              <Descriptions.Item label="语言">
                {config.language === 'zh' ? '中文' : 'English'}
              </Descriptions.Item>
              <Descriptions.Item label="标签数量">{config.tagCount}</Descriptions.Item>
            </Descriptions>
          </Card>

          {/* System Prompt */}
          <Card size="small" title="System Prompt">
            <pre
              style={{
                backgroundColor: '#f5f5f5',
                padding: 12,
                borderRadius: 4,
                maxHeight: 300,
                overflow: 'auto',
                fontSize: 12,
                margin: 0,
              }}
            >
              {config.systemPrompt || DEFAULT_SYSTEM_PROMPT}
            </pre>
          </Card>
        </Space>
      </Modal>
    );
  };

  // 渲染保存模板的 Modal
  const renderSaveModal = () => (
    <Modal
      title="保存当前配置为新模板"
      open={isSaveModalOpen}
      onCancel={() => {
        setIsSaveModalOpen(false);
        saveForm.resetFields();
      }}
      onOk={() => {
        saveForm.validateFields().then((values) => {
          addJDAnalyzerPreset({
            name: values.name,
            description: values.description,
            config: { ...jdAnalyzerConfig },
            isBuiltIn: false,
          });
          setIsSaveModalOpen(false);
          saveForm.resetFields();
          // message.success('模板保存成功！');
        });
      }}
    >
      <Form form={saveForm} layout="vertical">
        <Form.Item
          name="name"
          label="模板名称"
          rules={[{ required: true, message: '请输入模板名称' }]}
        >
          <Input placeholder="例如：我的自定义分析模板" />
        </Form.Item>
        <Form.Item
          name="description"
          label="描述"
          rules={[{ required: true, message: '请输入描述' }]}
        >
          <Input.TextArea rows={3} placeholder="简要描述这个模板的特点和适用场景" />
        </Form.Item>
      </Form>
    </Modal>
  );

  const currentPreset = getCurrentPreset();

  return (
    <Card>
      {/* 当前配置提示 */}
      {currentPreset && (
        <Alert
          type="info"
          showIcon
          style={{ marginBottom: 16 }}
          message={
            <Space>
              <Text strong>当前使用模板：</Text>
              <Text>{currentPreset.name}</Text>
              <Tag color={currentPreset.isBuiltIn ? 'blue' : 'green'}>
                {currentPreset.isBuiltIn ? '系统预设' : '自定义'}
              </Tag>
            </Space>
          }
        />
      )}

      <Tabs
        activeKey={activeTab}
        onChange={setActiveTab}
        items={[
          {
            key: 'presets',
            label: (
              <Space>
                <DatabaseOutlined />
                配置模板库
              </Space>
            ),
            children: renderPresetsTab(),
          },
          {
            key: 'dimensions',
            label: (
              <Space>
                <SettingOutlined />
                分析维度
              </Space>
            ),
            children: renderDimensionsTab(),
          },
          {
            key: 'description',
            label: (
              <Space>
                <FileTextOutlined />
                自由描述
              </Space>
            ),
            children: renderDescriptionTab(),
          },
          {
            key: 'prompt',
            label: (
              <Space>
                <EditOutlined />
                Prompt编辑
              </Space>
            ),
            children: renderPromptEditTab(),
          },
        ]}
      />

      {renderPresetModal()}
      {renderSaveModal()}
    </Card>
  );
}
