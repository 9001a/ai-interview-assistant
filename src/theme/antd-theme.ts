import { ThemeConfig } from 'antd';

export const warmYellowThemeToken = {
  // 主色调
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
};

export const warmYellowTheme: ThemeConfig = {
  token: warmYellowThemeToken,

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
      itemBg: '#FFF8E7',
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

    --border-radius-sm: 8px;
    --border-radius-md: 12px;
    --border-radius-lg: 16px;

    --shadow-sm: 0 2px 8px rgba(245, 166, 35, 0.1);
    --shadow-md: 0 4px 20px rgba(245, 166, 35, 0.15);
    --shadow-lg: 0 8px 40px rgba(245, 166, 35, 0.2);
  }
`;

export default warmYellowTheme;
