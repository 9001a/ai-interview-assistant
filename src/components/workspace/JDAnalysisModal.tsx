'use client';

import React, { useState } from 'react';
import { Modal, Input, Button, Space, Typography, Tabs } from 'antd';
import { FileTextOutlined, RobotOutlined, LoadingOutlined } from '@ant-design/icons';

const { TextArea } = Input;
const { Text } = Typography;

interface JDAnalysisModalProps {
  open: boolean;
  onCancel: () => void;
  onAnalyze: (jdText: string) => void;
  loading: boolean;
}

const sampleJD = `【岗位名称】高级后端开发工程师

【岗位职责】
1. 负责公司核心业务系统的架构设计和开发
2. 优化系统性能，保障高并发场景下的系统稳定性
3. 参与技术选型，推动技术创新

【任职要求】
1. 本科及以上学历，计算机相关专业
2. 3年以上 Java 开发经验，熟悉 Spring Boot、Spring Cloud
3. 熟悉 MySQL、Redis、消息队列等中间件
4. 具备良好的沟通能力和团队协作精神`;

export function JDAnalysisModal({ open, onCancel, onAnalyze, loading }: JDAnalysisModalProps) {
  const [jdText, setJdText] = useState('');
  const [activeTab, setActiveTab] = useState('input');

  const handleAnalyze = () => {
    if (!jdText.trim()) return;
    onAnalyze(jdText);
  };

  const handleUseSample = () => {
    setJdText(sampleJD);
  };

  const tabItems = [
    {
      key: 'input',
      label: (
        <span>
          <FileTextOutlined /> 输入 JD
        </span>
      ),
      children: (
        <>
          <div className="mb-4">
            <div className="flex justify-between items-center mb-2">
              <Text>粘贴 JD 文本，AI 将自动分析岗位要求</Text>
              <Button type="link" onClick={handleUseSample}>
                使用示例
              </Button>
            </div>
            <TextArea
              value={jdText}
              onChange={(e) => setJdText(e.target.value)}
              placeholder="在此粘贴 JD 内容..."
              rows={10}
              disabled={loading}
            />
          </div>

          <div className="flex justify-end gap-2">
            <Button onClick={onCancel}>取消</Button>
            <Button
              type="primary"
              icon={loading ? <LoadingOutlined /> : <RobotOutlined />}
              onClick={handleAnalyze}
              loading={loading}
              disabled={!jdText.trim()}
              className="bg-[#e1b382] hover:bg-[#d4a375] border-[#e1b382]"
            >
              {loading ? '分析中...' : 'AI 分析'}
            </Button>
          </div>
        </>
      ),
    },
    {
      key: 'help',
      label: <span>帮助</span>,
      children: (
        <div className="text-gray-600 space-y-3">
          <p>
            <strong>支持的 JD 来源：</strong>
          </p>
          <ul className="list-disc list-inside space-y-1 ml-2">
            <li>招聘网站（BOSS 直聘、拉勾、猎聘等）</li>
            <li>公司官网招聘页面</li>
            <li>内推 JD</li>
            <li>猎头提供的岗位描述</li>
          </ul>

          <p className="mt-4">
            <strong>分析内容：</strong>
          </p>
          <ul className="list-disc list-inside space-y-1 ml-2">
            <li>岗位核心要求提取</li>
            <li>隐藏要求识别</li>
            <li>日常工作内容</li>
            <li>发展前景分析</li>
            <li>技能标签生成</li>
          </ul>

          <div className="bg-[#fef9f3] p-3 rounded mt-4">
            <Text type="secondary">
              <strong>提示：</strong>可以添加多个相似的 JD，AI 会在简历优化时综合考虑这些岗位的共同要求。
            </Text>
          </div>
        </div>
      ),
    },
  ];

  return (
    <Modal
      title="添加 JD"
      open={open}
      onCancel={onCancel}
      width={700}
      footer={null}
    >
      <Tabs activeKey={activeTab} onChange={setActiveTab} items={tabItems} />
    </Modal>
  );
}
