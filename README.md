# AI 面试助手

基于 Next.js + OpenAI 的智能化面试陪练平台，实现 JD 深度分析、简历优化、模拟面试全流程。

## 功能特性

### JD 智能分析
- 8 维度深度解析：岗位概述、日常工作、隐含要求、发展前景、公司背景、薪资分析、面试重点、技能标签
- 可配置分析维度，自定义关注重点
- 支持分析风格切换（详细/简洁/专业）

### 面试官配置系统
- 预设角色模板（专业性/友好型/压力型）
- 自定义 System Prompt，完全控制 AI 行为
- 参数化风格调整（语气、表达、追问策略）
- 配置模板库，支持保存和加载

### 模拟面试
- 基于 JD + 简历的个性化面试
- 实时流式对话，打字机效果
- 多轮对话记忆与上下文管理
- 面试报告生成（综合评分 + 维度分析 + 改进建议）

### 数据管理
- 面试历史记录持久化
- JD 分析结果保存与复用
- 本地存储，数据隐私保护

## 技术栈

- **框架**: Next.js 16 (App Router) + React 19
- **语言**: TypeScript 5
- **样式**: Tailwind CSS 4 + shadcn/ui
- **状态管理**: Zustand
- **AI**: OpenAI API (GPT-4o-mini)
- **部署**: Docker + Node.js

## 本地运行

### 环境要求
- Node.js 18+
- pnpm

### 安装依赖

```bash
pnpm install
```

### 配置环境变量

```bash
cp .env.example .env.local
```

编辑 `.env.local`，填入你的 OpenAI API Key：

```
OPENAI_API_KEY=sk-your-api-key-here
OPENAI_API_BASE=https://api.openai.com/v1
OPENAI_MODEL=gpt-4o-mini
```

### 启动开发服务器

```bash
pnpm dev
```

访问 http://localhost:5000

### 构建生产版本

```bash
pnpm build
pnpm start
```

## 项目结构

```
src/
├── app/                    # Next.js App Router
│   ├── api/               # API 路由
│   │   ├── jd/analyze/    # JD 分析接口
│   │   ├── interview/chat/# 面试对话接口
│   │   └── ...
│   ├── settings/          # 设置页面
│   ├── interview/         # 面试页面
│   └── page.tsx           # 首页
├── components/            # React 组件
│   ├── jd/               # JD 相关组件
│   ├── interview/        # 面试相关组件
│   └── ui/               # shadcn/ui 基础组件
├── lib/                  # 工具库
│   ├── openai.ts        # OpenAI 调用封装
│   └── utils.ts         # 通用工具
├── stores/              # Zustand 状态管理
│   ├── interviewStore.ts
│   ├── jdStore.ts
│   └── authStore.ts
└── types/               # TypeScript 类型定义
    └── index.ts
```

## 核心实现亮点

### 1. 动态 Prompt 构建
根据用户配置的维度开关，自动生成结构化 Prompt，确保 AI 输出格式统一：

```typescript
// 根据启用的维度生成 JSON 格式要求
function buildJsonOutputFormat(dimensions) {
  // 动态生成字段要求
}
```

### 2. 面试官配置系统
支持多层级配置继承：
- 内置预设（不可修改）
- 用户自定义预设（可保存/加载/删除）
- 当前会话配置（临时调整）

### 3. 流式响应处理
基于 SSE 实现打字机效果：
- 后端：OpenAI Stream API
- 前端：EventSource + 增量渲染

## 环境变量说明

| 变量名 | 说明 | 必填 |
|--------|------|------|
| `OPENAI_API_KEY` | OpenAI API 密钥 | ✅ |
| `OPENAI_API_BASE` | API 基础 URL | 可选，默认官方 |
| `OPENAI_MODEL` | 使用模型 | 可选，默认 gpt-4o-mini |

## 许可证

MIT License

## 致谢

- [Next.js](https://nextjs.org)
- [shadcn/ui](https://ui.shadcn.com)
- [OpenAI](https://openai.com)
