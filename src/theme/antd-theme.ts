import { ThemeConfig } from 'antd';

export const warmYellowTheme: ThemeConfig = {
  // 主色调
  token: {
    colorPrimary: '#F5A623',
    colorPrimaryHover: '#FF9500',
    colorPrimaryActive: '#E69500',
    
    // 背景色
    colorBgContainer: '#FFF8E7',
    colorBgLayout: '#FFFBF5',
    colorBgElevated: '#FFFAF0',
    
    // 文字色
    colorText: '#5C4A32',
    colorTextSecondary: '#8B7355',
    colorTextTertiary: '#A69585',
    
    // 边框色
    colorBorder: '#E8DFD0',
    colorBorderSecondary: '#F0E8DD',
    
    // 功能色
    colorSuccess: '#52C41A',
    colorWarning: '#FAAD14',
    colorError: '#FF6B6B',
    colorInfo: '#1890FF',
    
    // 圆角
    borderRadius: 12,
    borderRadiusLG: 16,
    
    // 阴影
    boxShadow: '0 4px 20px rgba(245, 166, 35, 0.15)',
    
    // 字体
    fontFamily: "'PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei', sans-serif",
  },
  
  // 组件级主题
  components: {
    Button: {
      borderRadius: 12,
    },
    Card: {
      borderRadiusLG: 16,
    },
    Input: {
      borderRadius: 12,
      colorBgContainer: '#FFF8E7',
    },
    Select: {
      borderRadius: 12,
      colorBgContainer: '#FFF8E7',
    },
    Tabs: {
      colorPrimary: '#F5A623',
    },
    Menu: {
      colorItemBg: '#FFF8E7',
    },
  },
};

export const cssVariables = `
  :root {
    --color-primary: #F5A623;
    --color-primary-hover: #FF9500;
    --color-bg-page: #FFFBF5;
    --color-bg-card: #FFF8E7;
    --color-bg-elevated: #FFFAF0;
    --color-text: #5C4A32;
    --color-text-secondary: #8B7355;
    --color-border: #E8DFD0;
    --color-success: #52C41A;
    --color-warning: #FAAD14;
    --color-error: #FF6B6B;
    --color-info: #1890FF;
    
    /* 暖色渐变 */
    --gradient-warm: linear-gradient(135deg, #F5A623 0%, #FF9500 100%);
    --gradient-sunset: linear-gradient(135deg, #FFECD2 0%, #FCB69F 100%);
    
    /* 圆角 */
    --radius-sm: 8px;
    --radius-md: 12px;
    --radius-lg: 16px;
    
    /* 阴影 */
    --shadow-warm: 0 4px 20px rgba(245, 166, 35, 0.15);
    --shadow-card: 0 2px 12px rgba(92, 74, 50, 0.08);
  }
`;
