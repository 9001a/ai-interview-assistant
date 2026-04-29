'use client';

import { Layout, Menu, Typography, Button } from 'antd';
import { useState } from 'react';
import {
  FileTextOutlined,
  FilePdfOutlined,
  MessageOutlined,
  HistoryOutlined,
  PlusOutlined,
  BookOutlined,
  SettingOutlined,
} from '@ant-design/icons';
import { useAuthStore } from '@/stores/authStore';
import { useInterviewStore } from '@/stores/interviewStore';
import JDPage from '@/components/jd/JDPage';
import ResumePage from '@/components/resume/ResumePage';
import InterviewPage from '@/components/interview/InterviewPage';
import HistoryPage from '@/components/history/HistoryPage';
import KnowledgePage from '@/components/knowledge/KnowledgePage';
import SettingsPage from '@/components/settings/SettingsPage';

const { Header, Sider, Content } = Layout;
const { Title } = Typography;

type PageType = 'jd' | 'resume' | 'interview' | 'history' | 'knowledge' | 'settings';

export default function MainLayout() {
  const { logout } = useAuthStore();
  const { resetInterview } = useInterviewStore();
  const [currentPage, setCurrentPage] = useState<PageType>('jd');
  const [collapsed, setCollapsed] = useState(false);

  const menuItems = [
    {
      key: 'jd',
      icon: <FileTextOutlined />,
      label: 'JD分析',
    },
    {
      key: 'resume',
      icon: <FilePdfOutlined />,
      label: '简历优化',
    },
    {
      key: 'interview',
      icon: <MessageOutlined />,
      label: 'AI面试',
    },
    {
      key: 'history',
      icon: <HistoryOutlined />,
      label: '历史记录',
    },
    {
      key: 'knowledge',
      icon: <BookOutlined />,
      label: '知识库',
    },
  ];

  const handlePageChange = (key: string) => {
    setCurrentPage(key as PageType);
  };

  const renderContent = () => {
    switch (currentPage) {
      case 'jd':
        return <JDPage />;
      case 'resume':
        return <ResumePage />;
      case 'interview':
        return <InterviewPage />;
      case 'history':
        return <HistoryPage />;
      case 'knowledge':
        return <KnowledgePage />;
      case 'settings':
        return <SettingsPage />;
      default:
        return <JDPage />;
    }
  };

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider
        collapsible
        collapsed={collapsed}
        onCollapse={setCollapsed}
        theme="light"
        style={{ backgroundColor: '#FFF8E7' }}
      >
        <div style={{ padding: '20px 16px', textAlign: 'center' }}>
          <Title level={4} style={{ margin: 0, color: '#F5A623' }}>
            {collapsed ? 'AI' : 'AI求职助手'}
          </Title>
        </div>
        <Menu
          mode="inline"
          selectedKeys={[currentPage]}
          items={menuItems}
          onClick={({ key }) => handlePageChange(key)}
          style={{ backgroundColor: '#FFF8E7' }}
        />
      </Sider>
      <Layout>
        <Header
          style={{
            padding: '0 24px',
            backgroundColor: '#FFF8E7',
            borderBottom: '1px solid #E8DFD0',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <Title level={4} style={{ margin: 0, color: '#5C4A32' }}>
            {getPageTitle(currentPage)}
          </Title>
          <div style={{ display: 'flex', gap: 12 }}>
            <Button
              icon={<SettingOutlined />}
              onClick={() => setCurrentPage('settings')}
              type={currentPage === 'settings' ? 'primary' : 'default'}
            >
              设置
            </Button>
            <Button onClick={logout} danger>
              退出登录
            </Button>
          </div>
        </Header>
        <Content
          style={{
            padding: 24,
            backgroundColor: '#FFFBF5',
            minHeight: 'calc(100vh - 64px)',
          }}
        >
          {renderContent()}
        </Content>
      </Layout>
    </Layout>
  );
}

function getPageTitle(page: PageType): string {
  const titles: Record<PageType, string> = {
    jd: 'JD分析',
    resume: '简历优化',
    interview: 'AI面试',
    history: '历史记录',
    knowledge: '知识库',
    settings: '设置',
  };
  return titles[page] || 'JD分析';
}
