'use client';

import React, { useState } from 'react';
import { Modal, Form, Input, Select, Space, Typography } from 'antd';
import { FolderOutlined, CodeOutlined, AppstoreOutlined, ExperimentOutlined, SettingOutlined } from '@ant-design/icons';
import { useWorkspaceStore } from '@/stores/workspaceStore';
import { WorkspaceType } from '@/types';

const { Text } = Typography;
const { Option } = Select;

interface CreateWorkspaceModalProps {
  open: boolean;
  onCancel: () => void;
  onCreate: (name: string, type: WorkspaceType) => void;
}

const workspaceTypes = [
  { value: 'backend', label: '后端开发', icon: <CodeOutlined />, desc: 'Java、Go、Python 等后端岗位' },
  { value: 'frontend', label: '前端开发', icon: <AppstoreOutlined />, desc: 'Web、移动端、小程序等前端岗位' },
  { value: 'algorithm', label: '算法工程师', icon: <ExperimentOutlined />, desc: '机器学习、深度学习等算法岗位' },
  { value: 'product', label: '产品经理', icon: <FolderOutlined />, desc: '产品策划、需求分析等产品岗位' },
  { value: 'custom', label: '自定义', icon: <SettingOutlined />, desc: '其他类型的工作区' },
];

export function CreateWorkspaceModal({ open, onCancel, onCreate }: CreateWorkspaceModalProps) {
  const { createWorkspace } = useWorkspaceStore();
  const [form] = Form.useForm();
  const [selectedType, setSelectedType] = useState<WorkspaceType>('backend');

  const handleOk = async () => {
    try {
      const values = await form.validateFields();
      createWorkspace(values.name, values.type);
      onCreate(values.name, values.type);
      form.resetFields();
    } catch (error) {
      console.error('Form validation failed:', error);
    }
  };

  const handleCancel = () => {
    form.resetFields();
    onCancel();
  };

  return (
    <Modal
      title="新建工作区"
      open={open}
      onOk={handleOk}
      onCancel={handleCancel}
      okText="创建"
      cancelText="取消"
      okButtonProps={{ className: 'bg-[#e1b382] hover:bg-[#d4a375] border-[#e1b382]' }}
      width={500}
    >
      <Form
        form={form}
        layout="vertical"
        initialValues={{ type: 'backend' }}
      >
        <Form.Item
          label="工作区名称"
          name="name"
          rules={[
            { required: true, message: '请输入工作区名称' },
            { max: 50, message: '名称最多 50 个字符' },
          ]}
        >
          <Input placeholder="例如：后端大厂冲刺" />
        </Form.Item>

        <Form.Item
          label="工作区类型"
          name="type"
          rules={[{ required: true, message: '请选择工作区类型' }]}
        >
          <Select
            placeholder="选择工作区类型"
            onChange={(value) => setSelectedType(value as WorkspaceType)}
          >
            {workspaceTypes.map((type) => (
              <Option key={type.value} value={type.value}>
                <Space>
                  {type.icon}
                  <span>{type.label}</span>
                </Space>
              </Option>
            ))}
          </Select>
        </Form.Item>

        <div className="bg-[#fef9f3] p-3 rounded-md">
          <Text type="secondary" className="text-sm">
            <strong>提示：</strong>
            {workspaceTypes.find(t => t.value === selectedType)?.desc}
          </Text>
        </div>
      </Form>
    </Modal>
  );
}
