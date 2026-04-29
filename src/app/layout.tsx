'use client';

import { ConfigProvider } from 'antd';
import { warmYellowTheme } from '@/theme/antd-theme';
import './globals.css';

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN">
      <body style={{ backgroundColor: '#FFFBF5', minHeight: '100vh' }}>
        <ConfigProvider theme={warmYellowTheme}>
          {children}
        </ConfigProvider>
      </body>
    </html>
  );
}
