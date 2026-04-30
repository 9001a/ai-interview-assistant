'use client';

import { useState, useEffect } from 'react';
import {
  Card,
  Radio,
  Button,
  Typography,
  Space,
  Tag,
  Slider,
  Switch,
  Input,
  Alert,
  Tabs,
  Tooltip,
  Row,
  Col,
  Divider,
  message,
} from 'antd';
import {
  ThunderboltOutlined,
  EditOutlined,
  MessageOutlined,
  CodeOutlined,
  SaveOutlined,
  ReloadOutlined,
  InfoCircleOutlined,
} from '@ant-design/icons';
import type { InterviewerConfig } from '@/types';

const { Title, Text, Paragraph } = Typography;
const { TextArea } = Input;

// 预设模板
const PRESET_TEMPLATES: Array<{
  key: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  config: Partial<InterviewerConfig>;
  systemPrompt: string;
}> = [
  {
    key: 'professional',
    name: '专业型',
    description: '专业严谨，直接提问，注重技术细节',
    icon: <ThunderboltOutlined />,
    config: {
      type: 'professional',
      style: '专业严谨',
      tone: '正式',
      expression: '专业且简洁',
      questionStyle: '直接提问',
      features: {
        correctErrors: true,
        giveAnswers: true,
        askFollowUps: true,
        giveFeedback: true,
        doScoring: true,
      },
    },
    systemPrompt: `你是一个专业严谨的面试官，专注于评估候选人的技术能力和专业素养。

面试风格：
- 直接提出技术问题，不绕弯子
- 对答案要求逻辑严密、条理清晰
- 在关键概念上会深入追问细节

提问策略：
- 从基础概念开始，逐步深入
- 关注候选人对技术的理解深度
- 对模糊回答会要求澄清

纠错方式：
- 直接指出错误并解释原因
- 提供正确的思路和答案
- 考察候选人接受反馈的能力

面试材料：
- JD: {{jd_summary}}
- 简历: {{resume_summary}}

请先让候选人进行自我介绍，然后根据简历内容提出第一个技术问题。`,
  },
  {
    key: 'friendly',
    name: '友好型',
    description: '温和引导，逐步深入，注重沟通',
    icon: <MessageOutlined />,
    config: {
      type: 'friendly',
      style: '温和引导',
      tone: '温和',
      expression: '鼓励式',
      questionStyle: '逐步深入',
      features: {
        correctErrors: true,
        giveAnswers: false,
        askFollowUps: true,
        giveFeedback: true,
        doScoring: false,
      },
    },
    systemPrompt: `你是一个温和友好的面试官，像一个耐心的导师，善于引导候选人展现最好的自己。

面试风格：
- 对候选人比较耐心，会引导思考
- 在关键问题上要求逻辑严密但不咄咄逼人
- 语气温和但专业

提问策略：
- 使用"你为什么这么想？"来引导，而不是直接否定
- 关注候选人的思维过程，而不仅仅是答案
- 给候选人充分的表达空间

纠错方式：
- 温和地指出错误："这个思路有些问题，我们可以这样思考..."
- 通过提问引导候选人自己发现正确答案
- 肯定正确的部分，再指出改进空间

面试材料：
- JD: {{jd_summary}}
- 简历: {{resume_summary}}

请先让候选人进行自我介绍，营造轻松的面试氛围。`,
  },
  {
    key: 'stress',
    name: '压力型',
    description: '多轮追问，考察抗压，快速反应',
    icon: <ThunderboltOutlined style={{ color: '#ff4d4f' }} />,
    config: {
      type: 'stress',
      style: '压力测试',
      tone: '尖锐',
      expression: '挑战性',
      questionStyle: '连续追问',
      features: {
        correctErrors: true,
        giveAnswers: false,
        askFollowUps: true,
        giveFeedback: false,
        doScoring: true,
      },
    },
    systemPrompt: `你是一个严格的压力面试官，通过连续追问和尖锐问题来考察候选人的抗压能力和临场反应。

面试风格：
- 快速切换话题，不给候选人太多思考时间
- 对答案中的漏洞会立即追问
- 态度严肃，营造紧张的面试氛围

提问策略：
- 针对简历中的每个项目深挖细节
- 如果候选人回答模糊，立即打断追问
- 故意提出挑战性问题，观察候选人反应

纠错方式：
- 直接指出错误，不给予安慰
- 追问"你确定吗？"来施加压力
- 记录错误但不立即纠正，继续施压

面试材料：
- JD: {{jd_summary}}
- 简历: {{resume_summary}}

请直接开始提问，不做过多的寒暄。`,
  },
];

// 默认 System Prompt 模板
const DEFAULT_SYSTEM_PROMPT = `你是一个专业的面试官，负责评估候选人是否适合目标职位。

面试风格：{{style}}
语气：{{tone}}
表达方式：{{expression}}
提问风格：{{questionStyle}}

功能配置：
- 纠错：{{correctErrors}}
- 给出答案：{{giveAnswers}}
- 追问：{{askFollowUps}}
- 反馈：{{giveFeedback}}
- 评分：{{doScoring}}

面试材料：
- JD: {{jd_summary}}
- 简历: {{resume_summary}}
{{#if knowledge_context}}
- 参考知识：{{knowledge_context}}
{{/if}}

请根据以上信息开始面试。首先让候选人进行自我介绍。`;

interface InterviewerConfigPanelProps {
  initialConfig?: InterviewerConfig;
  onSave?: (config: InterviewerConfig) => void;
}

export default function InterviewerConfigPanel({
  initialConfig,
  onSave,
}: InterviewerConfigPanelProps) {
  const [activeTab, setActiveTab] = useState('quick');
  const [selectedPreset, setSelectedPreset] = useState('friendly');
  const [systemPrompt, setSystemPrompt] = useState(PRESET_TEMPLATES[1].systemPrompt);
  const [freeDescription, setFreeDescription] = useState('');
  const [generatedPrompt, setGeneratedPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);

  // 参数调整状态
  const [paramConfig, setParamConfig] = useState({
    style: '温和引导',
    tone: '温和',
    expression: '鼓励式',
    questionStyle: '逐步深入',
    strictness: 50,
    patience: 80,
    technicalDepth: 60,
    features: {
      correctErrors: true,
      giveAnswers: false,
      askFollowUps: true,
      giveFeedback: true,
      doScoring: false,
    },
  });

  // 当初始配置变化时更新
  useEffect(() => {
    if (initialConfig?.systemPrompt) {
      setSystemPrompt(initialConfig.systemPrompt);
    }
  }, [initialConfig]);

  // 快速选择 - 应用预设
  const handlePresetSelect = (key: string) => {
    setSelectedPreset(key);
    const preset = PRESET_TEMPLATES.find((p) => p.key === key);
    if (preset) {
      setSystemPrompt(preset.systemPrompt);
      message.success(`已选择「${preset.name}」模板`);
    }
  };

  // 参数调整 - 生成 Prompt
  const generatePromptFromParams = () => {
    const prompt = `你是一个${paramConfig.style}的面试官。

面试风格：
- 语气${paramConfig.tone}，表达方式${paramConfig.expression}
- 提问风格：${paramConfig.questionStyle}
- 严格程度：${paramConfig.strictness}%
- 耐心程度：${paramConfig.patience}%
- 技术深度：${paramConfig.technicalDepth}%

功能配置：
${paramConfig.features.correctErrors ? '- 会纠正候选人的错误' : ''}
${paramConfig.features.giveAnswers ? '- 会直接给出正确答案' : '- 引导候选人自己思考答案'}
${paramConfig.features.askFollowUps ? '- 会进行追问' : ''}
${paramConfig.features.giveFeedback ? '- 会给出反馈' : ''}
${paramConfig.features.doScoring ? '- 会进行评分' : ''}

面试材料：
- JD: {{jd_summary}}
- 简历: {{resume_summary}}

请开始面试。`;

    setSystemPrompt(prompt);
    message.success('已根据参数生成 Prompt');
  };

  // 自由描述 - AI 生成 Prompt
  const handleGenerateFromDescription = async () => {
    if (!freeDescription.trim()) {
      message.warning('请先描述您期望的面试官风格');
      return;
    }

    setIsGenerating(true);
    // 模拟 AI 生成（实际应该调用 API）
    await new Promise((resolve) => setTimeout(resolve, 1500));

    const generated = `你是一个根据以下描述定制的面试官：

用户期望：${freeDescription}

基于以上描述，我将以以下风格进行面试：
- 关注候选人的思维过程
- 提出有深度的问题
- 给予建设性的反馈

面试材料：
- JD: {{jd_summary}}
- 简历: {{resume_summary}}

请开始面试。`;

    setGeneratedPrompt(generated);
    setSystemPrompt(generated);
    setIsGenerating(false);
    message.success('Prompt 生成成功');
  };

  // 保存配置
  const handleSave = () => {
    const config: InterviewerConfig = {
      name: PRESET_TEMPLATES.find((p) => p.key === selectedPreset)?.name || '自定义面试官',
      type: selectedPreset as InterviewerConfig['type'],
      style: paramConfig.style,
      tone: paramConfig.tone,
      expression: paramConfig.expression,
      questionStyle: paramConfig.questionStyle,
      features: paramConfig.features,
      focusAreas: {
        technical: true,
        project: true,
        softSkills: true,
        career: false,
      },
      customDescription: freeDescription,
      systemPrompt: systemPrompt,
    };

    onSave?.(config);
    message.success('面试官配置已保存');
  };

  // 恢复默认
  const handleReset = () => {
    setSelectedPreset('friendly');
    setSystemPrompt(PRESET_TEMPLATES[1].systemPrompt);
    setActiveTab('quick');
    message.success('已恢复默认配置');
  };

  // 渲染快速选择模式
  const renderQuickSelect = () => (
    <Space direction="vertical" style={{ width: '100%' }} size="large">
      <Alert
        message="选择预设模板"
        description="使用系统预设的面试官风格。点击后会直接应用该模板的 System Prompt。"
        type="info"
        showIcon
      />
      <Row gutter={[16, 16]}>
        {PRESET_TEMPLATES.map((template) => (
          <Col span={8} key={template.key}>
            <Card
              hoverable
              onClick={() => handlePresetSelect(template.key)}
              style={{
                borderColor: selectedPreset === template.key ? '#F5A623' : undefined,
                backgroundColor: selectedPreset === template.key ? '#FFF8E7' : undefined,
              }}
            >
              <Space direction="vertical" align="center" style={{ width: '100%' }}>
                <div style={{ fontSize: 24 }}>{template.icon}</div>
                <Text strong>{template.name}</Text>
                <Text type="secondary" style={{ fontSize: 12, textAlign: 'center' }}>
                  {template.description}
                </Text>
              </Space>
            </Card>
          </Col>
        ))}
      </Row>

      {selectedPreset && (
        <Card
          title="当前 Prompt 预览"
          size="small"
          style={{ backgroundColor: '#fafafa' }}
        >
          <pre
            style={{
              margin: 0,
              whiteSpace: 'pre-wrap',
              fontSize: 13,
              maxHeight: 200,
              overflow: 'auto',
            }}
          >
            {systemPrompt}
          </pre>
        </Card>
      )}
    </Space>
  );

  // 渲染参数调整模式
  const renderParamAdjust = () => (
    <Space direction="vertical" style={{ width: '100%' }} size="large">
      <Alert
        message="调整参数生成 Prompt"
        description="通过参数调整面试官行为，点击「生成 Prompt」后会根据这些参数生成新的 System Prompt。这将覆盖当前已有的 Prompt。"
        type="info"
        showIcon
      />

      <Card title="基础风格" size="small">
        <Row gutter={[16, 16]}>
          <Col span={12}>
            <Text>面试风格</Text>
            <Input
              value={paramConfig.style}
              onChange={(e) =>
                setParamConfig({ ...paramConfig, style: e.target.value })
              }
              style={{ marginTop: 8 }}
              placeholder="如：温和引导、专业严谨"
            />
          </Col>
          <Col span={12}>
            <Text>语气</Text>
            <Input
              value={paramConfig.tone}
              onChange={(e) =>
                setParamConfig({ ...paramConfig, tone: e.target.value })
              }
              style={{ marginTop: 8 }}
              placeholder="如：温和、正式"
            />
          </Col>
          <Col span={12}>
            <Text>表达方式</Text>
            <Input
              value={paramConfig.expression}
              onChange={(e) =>
                setParamConfig({ ...paramConfig, expression: e.target.value })
              }
              style={{ marginTop: 8 }}
              placeholder="如：鼓励式、专业且简洁"
            />
          </Col>
          <Col span={12}>
            <Text>提问风格</Text>
            <Input
              value={paramConfig.questionStyle}
              onChange={(e) =>
                setParamConfig({ ...paramConfig, questionStyle: e.target.value })
              }
              style={{ marginTop: 8 }}
              placeholder="如：逐步深入、直接提问"
            />
          </Col>
        </Row>
      </Card>

      <Card title="程度调节" size="small">
        <Space direction="vertical" style={{ width: '100%' }}>
          <div>
            <Text>严格程度</Text>
            <Slider
              value={paramConfig.strictness}
              onChange={(v) => setParamConfig({ ...paramConfig, strictness: v })}
              min={0}
              max={100}
              marks={{ 0: '宽松', 50: '适中', 100: '严格' }}
            />
          </div>
          <div>
            <Text>耐心程度</Text>
            <Slider
              value={paramConfig.patience}
              onChange={(v) => setParamConfig({ ...paramConfig, patience: v })}
              min={0}
              max={100}
              marks={{ 0: '急躁', 50: '适中', 100: '极有耐心' }}
            />
          </div>
          <div>
            <Text>技术深度</Text>
            <Slider
              value={paramConfig.technicalDepth}
              onChange={(v) => setParamConfig({ ...paramConfig, technicalDepth: v })}
              min={0}
              max={100}
              marks={{ 0: '基础', 50: '适中', 100: '深入' }}
            />
          </div>
        </Space>
      </Card>

      <Card title="功能开关" size="small">
        <Row gutter={[16, 16]}>
          <Col span={12}>
            <Space>
              <Switch
                checked={paramConfig.features.correctErrors}
                onChange={(v) =>
                  setParamConfig({
                    ...paramConfig,
                    features: { ...paramConfig.features, correctErrors: v },
                  })
                }
              />
              <Text>纠正错误</Text>
            </Space>
          </Col>
          <Col span={12}>
            <Space>
              <Switch
                checked={paramConfig.features.giveAnswers}
                onChange={(v) =>
                  setParamConfig({
                    ...paramConfig,
                    features: { ...paramConfig.features, giveAnswers: v },
                  })
                }
              />
              <Text>直接给出答案</Text>
            </Space>
          </Col>
          <Col span={12}>
            <Space>
              <Switch
                checked={paramConfig.features.askFollowUps}
                onChange={(v) =>
                  setParamConfig({
                    ...paramConfig,
                    features: { ...paramConfig.features, askFollowUps: v },
                  })
                }
              />
              <Text>追问</Text>
            </Space>
          </Col>
          <Col span={12}>
            <Space>
              <Switch
                checked={paramConfig.features.giveFeedback}
                onChange={(v) =>
                  setParamConfig({
                    ...paramConfig,
                    features: { ...paramConfig.features, giveFeedback: v },
                  })
                }
              />
              <Text>给出反馈</Text>
            </Space>
          </Col>
          <Col span={12}>
            <Space>
              <Switch
                checked={paramConfig.features.doScoring}
                onChange={(v) =>
                  setParamConfig({
                    ...paramConfig,
                    features: { ...paramConfig.features, doScoring: v },
                  })
                }
              />
              <Text>评分</Text>
            </Space>
          </Col>
        </Row>
      </Card>

      <Button type="primary" onClick={generatePromptFromParams} block>
        根据参数生成 Prompt
      </Button>
    </Space>
  );

  // 渲染自由描述模式
  const renderFreeDescription = () => (
    <Space direction="vertical" style={{ width: '100%' }} size="large">
      <Alert
        message="自由描述生成 Prompt"
        description="用文字描述您期望的面试官风格，AI 会为您生成新的 System Prompt。这将完全覆盖当前已有的 Prompt。"
        type="warning"
        showIcon
      />

      <TextArea
        value={freeDescription}
        onChange={(e) => setFreeDescription(e.target.value)}
        placeholder={
          '例如：\n' +
          '- 像一个有经验的学长，耐心引导\n' +
          '- 对前端技术很了解，会问深入的原理问题\n' +
          '- 不会直接否定错误，而是引导思考\n' +
          '- 关注项目经验，会问很多细节'
        }
        rows={8}
      />

      <Button
        type="primary"
        onClick={handleGenerateFromDescription}
        loading={isGenerating}
        block
        icon={<ThunderboltOutlined />}
      >
        AI 生成 Prompt
      </Button>

      {generatedPrompt && (
        <Card title="生成的 Prompt" size="small" style={{ backgroundColor: '#f6ffed' }}>
          <pre
            style={{
              margin: 0,
              whiteSpace: 'pre-wrap',
              fontSize: 13,
              maxHeight: 200,
              overflow: 'auto',
            }}
          >
            {generatedPrompt}
          </pre>
        </Card>
      )}
    </Space>
  );

  // 渲染 Prompt 编辑模式
  const renderPromptEdit = () => (
    <Space direction="vertical" style={{ width: '100%' }} size="large">
      <Alert
        message="直接编辑 System Prompt（最终生效）"
        description="这是最终生效的 System Prompt，直接编辑即可生效。其他模式生成的 Prompt 最终也是保存到这里。可用变量：{{jd_summary}}、{{resume_summary}}、{{knowledge_context}}"
        type="warning"
        showIcon
      />

      <Card size="small" title="可用变量" style={{ backgroundColor: '#e6f7ff' }}>
        <Space wrap>
          <Tooltip title="JD 摘要">
            <Tag color="blue">{'{{jd_summary}}'}</Tag>
          </Tooltip>
          <Tooltip title="简历摘要">
            <Tag color="green">{'{{resume_summary}}'}</Tag>
          </Tooltip>
          <Tooltip title="知识库上下文（RAG）">
            <Tag color="purple">{'{{knowledge_context}}'}</Tag>
          </Tooltip>
        </Space>
      </Card>

      <TextArea
        value={systemPrompt}
        onChange={(e) => setSystemPrompt(e.target.value)}
        placeholder="输入 System Prompt..."
        rows={20}
        style={{ fontFamily: 'monospace', fontSize: 13 }}
      />
    </Space>
  );

  const tabItems = [
    {
      key: 'quick',
      label: (
        <Space>
          <ThunderboltOutlined />
          快速选择
        </Space>
      ),
      children: renderQuickSelect(),
    },
    {
      key: 'params',
      label: (
        <Space>
          <EditOutlined />
          参数调整
        </Space>
      ),
      children: renderParamAdjust(),
    },
    {
      key: 'describe',
      label: (
        <Space>
          <MessageOutlined />
          自由描述
        </Space>
      ),
      children: renderFreeDescription(),
    },
    {
      key: 'edit',
      label: (
        <Space>
          <CodeOutlined />
          Prompt编辑
        </Space>
      ),
      children: renderPromptEdit(),
    },
  ];

  return (
    <Card
      title={
        <Space>
          <Title level={5} style={{ margin: 0 }}>
            面试官配置
          </Title>
          <Tag color="orange">
            {PRESET_TEMPLATES.find((p) => p.key === selectedPreset)?.name || '自定义'}
          </Tag>
        </Space>
      }
      extra={
        <Space>
          <Button icon={<ReloadOutlined />} onClick={handleReset}>
            恢复默认
          </Button>
          <Button type="primary" icon={<SaveOutlined />} onClick={handleSave}>
            保存配置
          </Button>
        </Space>
      }
    >
      <Tabs
        activeKey={activeTab}
        onChange={setActiveTab}
        items={tabItems}
        type="card"
      />
    </Card>
  );
}
