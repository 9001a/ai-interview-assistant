'use client';

import { Card, Form, Select, Radio, Button, Space, Divider, Typography, Alert, Tag } from 'antd';
import { useState } from 'react';
import { useInterviewStore } from '@/stores/interviewStore';
import type { JDAnalysis, Resume, InterviewerConfig, InterviewerPreset, KnowledgeDocument } from '@/types';

const { Title, Text } = Typography;
const { Option } = Select;
const { Group: RadioGroup, Button: RadioButton } = Radio;

interface InterviewSetupProps {
  onStart: (config: {
    jd: JDAnalysis | null;
    resume: Resume | null;
    knowledgeBase: KnowledgeDocument | null;
    interviewerConfig: InterviewerConfig;
  }) => void;
  jdOptions: Array<{ value: string; label: string; jd: JDAnalysis }>;
  resumeOptions: Array<{ value: string; label: string; resume: Resume }>;
  knowledgeBaseOptions: Array<{ value: string; label: string; kb: KnowledgeDocument }>;
}



export default function InterviewSetup({
  onStart,
  jdOptions,
  resumeOptions,
  knowledgeBaseOptions,
}: InterviewSetupProps) {
  const [form] = Form.useForm();
  const [selectedPresetId, setSelectedPresetId] = useState<string>('builtin-friendly');

  // 从 Store 读取 presets 和当前配置
  const { presets, interviewerConfig: savedConfig } = useInterviewStore();
  const userPresets = presets.filter((p: InterviewerPreset) => !p.isBuiltIn);
  const hasCustomConfig = userPresets.length > 0 || savedConfig.systemPrompt;

  const handleSubmit = () => {
    form.validateFields().then((values) => {
      const selectedJD = jdOptions.find(o => o.value === values.jdId);
      const selectedResume = resumeOptions.find(o => o.value === values.resumeId);
      const selectedKB = knowledgeBaseOptions.find(o => o.value === values.knowledgeBaseId);

      // 根据选择的 preset 获取配置
      const selectedPreset = presets.find((p: InterviewerPreset) => p.id === selectedPresetId);
      const interviewerConfig = selectedPreset ? selectedPreset.config : savedConfig;

      onStart({
        jd: selectedJD?.jd || null,
        resume: selectedResume?.resume || null,
        knowledgeBase: selectedKB?.kb || null,
        interviewerConfig,
      });
    });
  };

  return (
    <Card
      title={
        <Title level={4} style={{ margin: 0 }}>
          开始面试
        </Title>
      }
      style={{ borderRadius: 16 }}
    >
      <Form form={form} layout="vertical">
        <Alert
          title="请选择面试配置"
          description="选择 JD、简历、知识库和面试官类型"
          type="info"
          showIcon
          style={{ marginBottom: 24 }}
        />

        <Form.Item
          name="jdId"
          label="选择 JD"
          rules={[{ required: true, message: '请选择 JD' }]}
        >
          <Select placeholder="请选择 JD" showSearch>
            {jdOptions.map(opt => (
              <Option key={opt.value} value={opt.value}>
                {opt.label}
              </Option>
            ))}
          </Select>
        </Form.Item>

        <Form.Item
          name="resumeId"
          label="选择简历"
          rules={[{ required: true, message: '请选择简历' }]}
        >
          <Select placeholder="请选择简历" showSearch>
            {resumeOptions.map(opt => (
              <Option key={opt.value} value={opt.value}>
                {opt.label}
              </Option>
            ))}
          </Select>
        </Form.Item>

        <Form.Item
          name="knowledgeBaseId"
          label="选择知识库（可选）"
        >
          <Select placeholder="不使用知识库" allowClear>
            {knowledgeBaseOptions.map(opt => (
              <Option key={opt.value} value={opt.value}>
                {opt.label}
              </Option>
            ))}
          </Select>
        </Form.Item>

        <Divider />

        <Form.Item label="面试官风格">
          <Text type="secondary" style={{ display: 'block', marginBottom: 12 }}>
            选择系统预设或您在设置页面保存的自定义模板
          </Text>
          
          <Title level={5} style={{ fontSize: 14, marginTop: 16 }}>系统预设</Title>
          <RadioGroup
            value={selectedPresetId}
            onChange={(e) => setSelectedPresetId(e.target.value)}
            style={{ width: '100%' }}
          >
            {presets
              .filter((p: InterviewerPreset) => p.isBuiltIn)
              .map((preset: InterviewerPreset) => (
                <RadioButton
                  key={preset.id}
                  value={preset.id}
                  style={{ width: '33.33%' }}
                >
                  <span style={{ fontSize: 13 }}>{preset.name}</span>
                </RadioButton>
              ))}
          </RadioGroup>

          {userPresets.length > 0 && (
            <>
              <Title level={5} style={{ fontSize: 14, marginTop: 16 }}>我的模板</Title>
              <RadioGroup
                value={selectedPresetId}
                onChange={(e) => setSelectedPresetId(e.target.value)}
                style={{ width: '100%' }}
              >
                {userPresets.map((preset: InterviewerPreset) => (
                  <RadioButton
                    key={preset.id}
                    value={preset.id}
                    style={{ width: userPresets.length === 1 ? '100%' : '50%' }}
                  >
                    <span style={{ fontSize: 13 }}>{preset.name}</span>
                    <Tag color="orange" style={{ marginLeft: 4, fontSize: 10, padding: '0 4px' }}>自定义</Tag>
                  </RadioButton>
                ))}
              </RadioGroup>
            </>
          )}
        </Form.Item>

        <div style={{ padding: 16, backgroundColor: '#FFF8E7', borderRadius: 8 }}>
          {(() => {
            const selectedPreset = presets.find((p: InterviewerPreset) => p.id === selectedPresetId);
            return selectedPreset ? (
              <>
                <Text strong>{selectedPreset.name}</Text>
                <br />
                <Text type="secondary" style={{ fontSize: 14 }}>
                  {selectedPreset.description}
                </Text>
              </>
            ) : (
              <>
                <Text strong>{savedConfig.name || '自定义配置'}</Text>
                <br />
                <Text type="secondary" style={{ fontSize: 14 }}>
                  使用您在设置页面配置的面试官风格
                </Text>
              </>
            );
          })()}
        </div>
      </Form>
      <div style={{ marginTop: 24, textAlign: 'center' }}>
        <Button 
          type="primary" 
          size="large" 
          onClick={handleSubmit}
          style={{ height: 48, minWidth: 180, fontSize: 16 }}
        >
          开始面试
        </Button>
      </div>
    </Card>
  );
}
