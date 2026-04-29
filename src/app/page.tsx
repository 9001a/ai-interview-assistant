'use client';

import { useEffect, useState } from 'react';
import { ConfigProvider, theme, Spin, App } from 'antd';
import { warmYellowThemeToken } from '@/theme/antd-theme';
import { useAuthStore } from '@/stores/authStore';
import Login from '@/components/auth/Login';
import MainLayout from '@/components/layout/MainLayout';

export default function Home() {
  const { isLoggedIn, initialize } = useAuthStore();
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    console.log('🔄 页面加载，初始化...');
    initialize();
    setIsHydrated(true);
    console.log('✅ 初始化完成，当前登录状态:', isLoggedIn);
  }, []);

  useEffect(() => {
    console.log('📊 登录状态变化:', { isLoggedIn, isHydrated });
  }, [isLoggedIn, isHydrated]);

  if (!isHydrated) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh'
      }}>
        <Spin size="large" />
      </div>
    );
  }

  console.log('🖥️ 渲染页面，登录状态:', isLoggedIn);

  if (!isLoggedIn) {
    return (
      <ConfigProvider
        theme={{
          algorithm: theme.defaultAlgorithm,
          token: warmYellowThemeToken,
        }}
      >
        <App>
          <Login />
        </App>
      </ConfigProvider>
    );
  }

  return (
    <ConfigProvider
      theme={{
        algorithm: theme.defaultAlgorithm,
        token: warmYellowThemeToken,
      }}
    >
      <App>
        <MainLayout />
      </App>
    </ConfigProvider>
  );
}
