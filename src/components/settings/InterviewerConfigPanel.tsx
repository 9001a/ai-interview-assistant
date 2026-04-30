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
  List,
  Popconfirm,
  Modal,
} from 'antd';
import {
  ThunderboltOutlined,
  EditOutlined,
  MessageOutlined,
  CodeOutlined,
  SaveOutlined,
  ReloadOutlined,
  InfoCircleOutlined,
  PlusOutlined,
  DeleteOutlined,
  EditOutlined as EditIcon,
  CopyOutlined,
} from '@ant-design/icons';
import type { InterviewerConfig, InterviewerPreset } from '@/types';
import { useInterviewStore } from '@/stores/interviewStore';

const { Title, Text, Paragraph } = Typography;
const { TextArea } = Input;

// 系统预设模板（用于快速选择）

// 默认配置
const defaultConfig: InterviewerConfig = {
  name: '自定义面试官',
  type: 'custom',
  style: '',
  tone: '',
  expression: '',
  questionStyle: '',
  features: {
    correctErrors: true,
    giveAnswers: false,
    askFollowUps: true,
    giveFeedback: true,
    doScoring: false,
  },
  focusAreas: {
    technical: true,
    project: true,
    softSkills: true,
    career: false,
  },
};

export function InterviewerConfigPanel() {
  const {
    interviewerConfig,
    setInterviewerConfig,
    presets,
    activePresetId,
    addPreset,
    deletePreset,
    loadPreset,
  } = useInterviewStore();

  // 用户自定义模板
  const userPresets = presets.filter((p: InterviewerPreset) => !p.isBuiltIn);

  const [activeTab, setActiveTab] = useState('presets');
  const [customPrompt, setCustomPrompt] = useState(interviewerConfig.systemPrompt || '');
  const [customDescription, setCustomDescription] = useState('');
  const [isSaveModalOpen, setIsSaveModalOpen] = useState(false);
  const [newPresetName, setNewPresetName] = useState('');
  const [newPresetDesc, setNewPresetDesc] = useState('');

  // 参数调整相关状态
  const [strictness, setStrictness] = useState(50);
  const [patience, setPatience] = useState(70);
  const [technicalDepth, setTechnicalDepth] = useState(80);
  const [features, setFeatures] = useState(interviewerConfig.features);

  useEffect(() => {
    setCustomPrompt(interviewerConfig.systemPrompt || '');
    setFeatures(interviewerConfig.features);
  }, [interviewerConfig]);

  // 保存配置到 localStorage
  const saveConfig = (config: InterviewerConfig) => {
    setInterviewerConfig(config);
    if (typeof window !== 'undefined') {
      localStorage.setItem('interviewer_config', JSON.stringify(config));
    }
    message.success('配置已保存');
  };

  // 保存为新模板
  const handleSaveAsPreset = () => {
    if (!newPresetName.trim()) {
      message.error('请输入模板名称');
      return;
    }

    const newPreset: Omit<InterviewerPreset, 'id' | 'createdAt' | 'updatedAt'> = {
      name: newPresetName,
      description: newPresetDesc || '用户自定义模板',
      config: { ...interviewerConfig, systemPrompt: customPrompt },
      isBuiltIn: false,
    };

    addPreset(newPreset);
    message.success('模板已保存');
    setIsSaveModalOpen(false);
    setNewPresetName('');
    setNewPresetDesc('');
  };

  // 从参数生成 Prompt
  const generatePromptFromParams = () => {
    const style = strictness > 70 ? '严格' : strictness > 40 ? '专业' : '温和';
    const tone = patience > 70 ? '耐心引导' : patience > 40 ? '正常' : '快节奏';
    const depth = technicalDepth > 70 ? '深入' : technicalDepth > 40 ? '适中' : '基础';

    const prompt = `你是一位${style}的面试官，面试风格${tone}，技术考察深度为${depth}。

面试风格：
- ${strictness > 70 ? '对技术要求严格，会直接指出问题' : strictness > 40 ? '注重技术准确性' : '温和友善，耐心引导'}
- ${patience > 70 ? '会给候选人充分的时间思考和回答' : patience > 40 ? '正常节奏，适当等待' : '节奏较快，需要快速回答'}
- ${technicalDepth > 70 ? '会深入追问技术细节和原理' : technicalDepth > 40 ? '关注核心概念和实现' : '主要考察基础知识'}

功能设置：
${features.correctErrors ? '- ✓ 会纠正候选人的错误' : '- ✗ 不会主动纠正错误'}
${features.giveAnswers ? '- ✓ 候选人说不出时会提供参考答案' : '- ✗ 不会直接给出答案'}
${features.askFollowUps ? '- ✓ 会根据回答进行追问' : '- ✗ 不会追问细节'}
${features.giveFeedback ? '- ✓ 会给出评价和建议' : '- ✗ 不会给出详细反馈'}
${features.doScoring ? '- ✓ 会进行评分' : '- ✗ 不会评分'}

面试材料：
- JD: {{jd_summary}}
- 简历: {{resume_summary}}
{{knowledge_context}}

现在开始面试吧！`;

    setCustomPrompt(prompt);
    saveConfig({ ...interviewerConfig, systemPrompt: prompt, features });
    message.success('Prompt 已生成并保存');
  };

  // 从自由描述生成 Prompt
  const generatePromptFromDescription = async () => {
    if (!customDescription.trim()) {
      message.error('请先描述您期望的面试官风格');
      return;
    }

    message.loading('正在生成 Prompt...', 0);

    try {
      // 这里可以调用 AI API 来生成 Prompt
      // 暂时用简单的方式生成
      const prompt = `你是一位面试官，${customDescription}。

面试风格：
- 根据候选人的回答灵活调整
- 关注候选人的专业能力和潜力
- 保持专业和尊重

面试材料：
- JD: {{jd_summary}}
- 简历: {{resume_summary}}
{{knowledge_context}}

现在开始面试吧！`;

      setCustomPrompt(prompt);
      saveConfig({ ...interviewerConfig, systemPrompt: prompt });
      message.destroy();
      message.success('Prompt 已生成');
    } catch {
      message.destroy();
      message.error('生成失败，请稍后重试');
    }
  };

  // 渲染预设模板列表
  const renderPresetsTab = () => (
    <div style={{ padding: '16px 0' }}>
      <Alert
        message="配置模板库"
        description="选择一个预设模板作为基础，然后可以在其他标签页中进一步自定义。您也可以将当前配置保存为新模板供以后使用。"
        type="info"
        showIcon
        style={{ marginBottom: 16 }}
      />

      <Title level={5}>系统预设</Title>
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        {presets
          .filter((p) => p.isBuiltIn)
          .map((preset) => (
            <Col span={8} key={preset.id}>
              <Card
                hoverable
                style={{
                  borderColor: activePresetId === preset.id ? '#1890ff' : undefined,
                }}
                onClick={() => loadPreset(preset.id)}
              >
                <div style={{ textAlign: 'center' }}>
                  <ThunderboltOutlined style={{ fontSize: 24, marginBottom: 8 }} />
                  <div style={{ fontWeight: 'bold' }}>{preset.name}</div>
                  <Text type="secondary" style={{ fontSize: 12 }}>
                    {preset.description}
                  </Text>
                </div>
              </Card>
            </Col>
          ))}
      </Row>

      <Divider />

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Title level={5} style={{ margin: 0 }}>我的模板</Title>
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={() => setIsSaveModalOpen(true)}
        >
          保存当前配置为新模板
        </Button>
      </div>

      {userPresets.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '40px 0', color: '#999' }}>
          暂无自定义模板，配置好面试官后点击上方按钮保存
        </div>
      ) : (
        <List<InterviewerPreset>
          style={{ marginTop: 16 }}
          dataSource={userPresets}
          renderItem={(preset: InterviewerPreset) => (
            <List.Item
              key={preset.id}
              actions={[
                <Button key="load" type="link" onClick={() => loadPreset(preset.id)}>
                  加载
                </Button>,
                <Popconfirm
                  key="delete"
                  title="确定删除这个模板吗？"
                  onConfirm={() => deletePreset(preset.id)}
                >
                  <Button type="link" danger>
                    删除
                  </Button>
                </Popconfirm>,
              ]}
            >
              <List.Item.Meta
                title={
                  <Space>
                    {preset.name}
                    {activePresetId === preset.id && <Tag color="blue">当前使用</Tag>}
                  </Space>
                }
                description={preset.description}
              />
            </List.Item>
          )}
        />
      )}

      <Modal
        title="保存为新模板"
        open={isSaveModalOpen}
        onOk={handleSaveAsPreset}
        onCancel={() => setIsSaveModalOpen(false)}
      >
        <Space direction="vertical" style={{ width: '100%' }}>
          <div>
            <Text>模板名称</Text>
            <Input
              placeholder="例如：销售岗位面试官"
              value={newPresetName}
              onChange={(e) => setNewPresetName(e.target.value)}
            />
          </div>
          <div>
            <Text>描述（可选）</Text>
            <Input.TextArea
              placeholder="描述这个模板适合的场景"
              value={newPresetDesc}
              onChange={(e) => setNewPresetDesc(e.target.value)}
              rows={3}
            />
          </div>
        </Space>
      </Modal>
    </div>
  );


  // 渲染参数调整 Tab
  const renderParamsTab = () => (
    <div style={{ padding: '16px 0' }}>
      <Alert
        message="通过参数调整面试官行为，点击「生成 Prompt」后会根据这些参数生成新的 System Prompt。这将覆盖当前已有的 Prompt。"
        type="info"
        showIcon
        style={{ marginBottom: 24 }}
      />

      <Title level={5}>风格调整</Title>
      <Row gutter={[48, 24]} style={{ marginBottom: 24 }}>
        <Col span={24}>
          <div style={{ marginBottom: 8 }}>
            <Text>严格程度</Text>
            <Text type="secondary" style={{ float: 'right' }}>
              {strictness > 70 ? '严格' : strictness > 40 ? '适中' : '宽松'}
            </Text>
          </div>
          <Slider
            value={strictness}
            onChange={setStrictness}
            marks={{ 0: '宽松', 50: '适中', 100: '严格' }}
          />
        </Col>
        <Col span={24}>
          <div style={{ marginBottom: 8 }}>
            <Text>耐心程度</Text>
            <Text type="secondary" style={{ float: 'right' }}>
              {patience > 70 ? '耐心' : patience > 40 ? '正常' : '快节奏'}
            </Text>
          </div>
          <Slider
            value={patience}
            onChange={setPatience}
            marks={{ 0: '快节奏', 50: '正常', 100: '耐心' }}
          />
        </Col>
        <Col span={24}>
          <div style={{ marginBottom: 8 }}>
            <Text>技术深度</Text>
            <Text type="secondary" style={{ float: 'right' }}>
              {technicalDepth > 70 ? '深入' : technicalDepth > 40 ? '适中' : '基础'}
            </Text>
          </div>
          <Slider
            value={technicalDepth}
            onChange={setTechnicalDepth}
            marks={{ 0: '基础', 50: '适中', 100: '深入' }}
          />
        </Col>
      </Row>

      <Divider />

      <Title level={5}>功能开关</Title>
      <Row gutter={[24, 16]} style={{ marginBottom: 24 }}>
        <Col span={12}>
          <Card size="small">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ fontWeight: 'bold' }}>纠正错误</div>
                <Text type="secondary" style={{ fontSize: 12 }}>
                  候选人回答错误时进行纠正
                </Text>
              </div>
              <Switch
                checked={features.correctErrors}
                onChange={(checked) => setFeatures((f) => ({ ...f, correctErrors: checked }))}
              />
            </div>
          </Card>
        </Col>
        <Col span={12}>
          <Card size="small">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ fontWeight: 'bold' }}>给出答案</div>
                <Text type="secondary" style={{ fontSize: 12 }}>
                  候选人说不出时提供参考答案
                </Text>
              </div>
              <Switch
                checked={features.giveAnswers}
                onChange={(checked) => setFeatures((f) => ({ ...f, giveAnswers: checked }))}
              />
            </div>
          </Card>
        </Col>
        <Col span={12}>
          <Card size="small">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ fontWeight: 'bold' }}>追问细节</div>
                <Text type="secondary" style={{ fontSize: 12 }}>
                  根据回答进行追问
                </Text>
              </div>
              <Switch
                checked={features.askFollowUps}
                onChange={(checked) => setFeatures((f) => ({ ...f, askFollowUps: checked }))}
              />
            </div>
          </Card>
        </Col>
        <Col span={12}>
          <Card size="small">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ fontWeight: 'bold' }}>给出反馈</div>
                <Text type="secondary" style={{ fontSize: 12 }}>
                  面试过程中给出评价和建议
                </Text>
              </div>
              <Switch
                checked={features.giveFeedback}
                onChange={(checked) => setFeatures((f) => ({ ...f, giveFeedback: checked }))}
              />
            </div>
          </Card>
        </Col>
        <Col span={12}>
          <Card size="small">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ fontWeight: 'bold' }}>评分功能</div>
                <Text type="secondary" style={{ fontSize: 12 }}>
                  面试过程中进行评分
                </Text>
              </div>
              <Switch
                checked={features.doScoring}
                onChange={(checked) => setFeatures((f) => ({ ...f, doScoring: checked }))}
              />
            </div>
          </Card>
        </Col>
      </Row>

      <Button type="primary" size="large" onClick={generatePromptFromParams} block>
        <SaveOutlined /> 生成 Prompt
      </Button>
    </div>
  );

  // 渲染自由描述 Tab
  const renderDescriptionTab = () => (
    <div style={{ padding: '16px 0' }}>
      <Alert
        message="用文字描述您期望的面试官风格，AI 会为您生成新的 System Prompt。这将完全覆盖当前已有的 Prompt。"
        type="warning"
        showIcon
        style={{ marginBottom: 24 }}
      />

      <Title level={5}>描述您期望的面试官风格</Title>
      <TextArea
        value={customDescription}
        onChange={(e) => setCustomDescription(e.target.value)}
        placeholder="例如：我希望面试官像一位经验丰富的技术总监，关注候选人的架构设计能力，面试风格比较轻松但会在关键问题上深入追问..."
        rows={6}
        style={{ marginBottom: 16 }}
      />

      <Button
        type="primary"
        size="large"
        onClick={generatePromptFromDescription}
        disabled={!customDescription.trim()}
        block
      >
        <EditOutlined /> 生成 Prompt
      </Button>
    </div>
  );

  // 渲染 Prompt 编辑 Tab
  const renderPromptEditTab = () => (
    <div style={{ padding: '16px 0' }}>
      <Alert
        message="这是最终生效的 System Prompt，直接编辑即可生效。其他模式生成的 Prompt 最终也是保存到这里。"
        description="可用变量：{{jd_summary}}、{{resume_summary}}、{{knowledge_context}}"
        type="warning"
        showIcon
        style={{ marginBottom: 16 }}
      />

      <TextArea
        value={customPrompt}
        onChange={(e) => setCustomPrompt(e.target.value)}
        rows={20}
        style={{ fontFamily: 'monospace', marginBottom: 16 }}
      />

      <Row gutter={[16, 16]}>
        <Col span={12}>
          <Button
            type="primary"
            size="large"
            onClick={() => saveConfig({ ...interviewerConfig, systemPrompt: customPrompt })}
            block
          >
            <SaveOutlined /> 保存配置
          </Button>
        </Col>
        <Col span={12}>
          <Button
            size="large"
            onClick={() => {
              setCustomPrompt(interviewerConfig.systemPrompt || '');
              message.info('已恢复');
            }}
            block
          >
            <ReloadOutlined /> 恢复
          </Button>
        </Col>
      </Row>
    </div>
  );

  return (
    <Card>
      <Tabs
        activeKey={activeTab}
        onChange={setActiveTab}
        items={[
          {
            key: 'presets',
            label: (
              <span>
                <CopyOutlined /> 配置模板库
              </span>
            ),
            children: renderPresetsTab(),
          },
          {
            key: 'params',
            label: (
              <span>
                <EditOutlined /> 参数调整
              </span>
            ),
            children: renderParamsTab(),
          },
          {
            key: 'description',
            label: (
              <span>
                <MessageOutlined /> 自由描述
              </span>
            ),
            children: renderDescriptionTab(),
          },
          {
            key: 'prompt',
            label: (
              <span>
                <CodeOutlined /> Prompt编辑
              </span>
            ),
            children: renderPromptEditTab(),
          },
        ]}
      />
    </Card>
  );
}
