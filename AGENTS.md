# 审小助 — 项目架构指南

> 本文档面向所有参与本项目的开发者（包括 AI Agent），提供项目结构、技术约定和开发规范。

## 技术栈

| 层       | 技术                       | 说明                                 |
| -------- | -------------------------- | ------------------------------------ |
| 前端     | Next.js 14 (App Router)    | 前后端一体化，React Server Components |
| 样式     | Tailwind CSS + shadcn/ui   | 白色底 + 蓝色点缀主题                |
| 数据库   | Supabase (PostgreSQL)      | 含 Auth 认证、RLS 行级权限           |
| AI编排   | LangChain                  | 审图规划功能使用                     |
| LLM      | DeepSeek V4 Flash (官方API)| 仅用于审图规划功能                   |
| 知识库AI | Coze 工作流 API            | 规范查询 + 专家匹配                  |
| 部署     | Vercel                     | 默认 *.vercel.app 域名               |

## 目录结构

```
shenxiaozu-demo/
├── .agents/                  # Agent 辅助配置
├── src/
│   ├── app/                  # Next.js App Router 页面
│   │   ├── (auth)/           # 认证相关页面（登录/注册）
│   │   ├── (dashboard)/      # 主应用页面（需登录）
│   │   │   ├── projects/     # 项目列表与创建
│   │   │   ├── review/       # 审图规划
│   │   │   ├── code-query/   # 规范查询
│   │   │   ├── expert-match/ # 专家匹配
│   │   │   ├── kb-upload/    # 知识库上传（管理员）
│   │   │   └── placeholder/  # 非MVP占位页面
│   │   ├── api/              # API Routes（后端专属逻辑）
│   │   │   ├── auth/         # 认证相关 API
│   │   │   ├── review/       # 审图规划 API（调用 DeepSeek）
│   │   │   ├── coze/         # Coze 工作流代理 API
│   │   │   └── upload/       # 文件上传 API
│   │   ├── layout.tsx        # 根布局
│   │   └── page.tsx          # 首页（重定向到登录或仪表盘）
│   ├── components/           # 可复用 UI 组件
│   │   ├── ui/               # shadcn/ui 组件（自动生成）
│   │   └── shared/           # 业务共享组件
│   ├── lib/                  # 工具库与配置
│   │   ├── supabase/         # Supabase 客户端/服务端 SDK
│   │   │   ├── client.ts     # 前端匿名客户端
│   │   │   └── server.ts     # 后端 Service Role 客户端
│   │   ├── db/               # 数据库相关
│   │   │   └── schema.sql    # 完整建表 SQL
│   │   ├── coze.ts           # Coze 工作流调用封装
│   │   ├── deepseek.ts       # DeepSeek API 调用封装
│   │   └── utils.ts          # 通用工具函数
│   └── middleware.ts         # Next.js 中间件（路由保护）
├── .env                      # 环境变量（真实密钥，已 gitignore）
├── .env.example              # 环境变量模板
├── AGENTS.md                 # 本文档
├── ARCHITECTURE.md           # 架构说明
├── CONTRIBUTING.md           # 开发指引
├── progress.md               # 开发进度
└── package.json
```

## 路由规范

| 模式                     | 说明                                  |
| ------------------------ | ------------------------------------- |
| /(auth)/login            | 登录页                                |
| /(auth)/register         | 注册页                                |
| /(dashboard)             | 主应用（需登录，有侧边栏/顶栏布局）   |
| /(dashboard)/projects    | 项目列表                              |
| /(dashboard)/projects/new| 新建项目                              |
| /(dashboard)/projects/[id] | 项目详情                            |
| /(dashboard)/review/[id] | 审图规划                              |
| /(dashboard)/code-query  | 规范查询                              |
| /(dashboard)/expert-match| 专家匹配                              |
| /(dashboard)/kb-upload   | 知识库上传（管理员）                   |
| /api/...                 | API Routes（不返回页面，只返回 JSON）  |

## API 设计规范

- 所有敏感操作（调用 AI API、文件上传等）走 API Routes，不在客户端直接调用第三方 API
- API Route 统一返回 `{ success: boolean, data?: T, error?: string }` 格式
- 前端只通过 Supabase Anon Key + RLS 做基本的数据库行级访问
- Service Role Key 仅在 server.ts 和 API Routes 中使用，不暴露到浏览器

## 样式约定

- 颜色：白色背景 (#ffffff)，蓝色点缀 (primary 使用 shadcn 配置的蓝色)
- 组件库：[shadcn/ui](https://ui.shadcn.com/) 标准组件
- 图标：lucide-react
- 布局：响应式，优先 PC 端大屏体验

## Supabase 使用规范

- 前端只使用 `src/lib/supabase/client.ts`（Anon Key + RLS）
- 后端使用 `src/lib/supabase/server.ts`（Service Role Key，绕过 RLS）
- 数据库操作优先通过 Supabase SDK，复杂查询用 raw SQL
- 所有 RLS 策略定义在 `src/lib/db/schema.sql` 中

## 认证与权限

- 用户角色：user（普通用户）/ admin（管理员）
- 角色存储在 `public.profiles` 表中，注册时默认 user
- 管理员手动在 Supabase Dashboard 或通过 API 升级
- 路由保护：middleware.ts 拦截未登录访问，重定向到登录页
- 非管理员访问管理员页面（如 kb-upload）显示无权限提示

## MVP vs 非 MVP

| 功能         | 状态 | 说明                                             |
| ------------ | ---- | ------------------------------------------------ |
| 项目创建     | MVP  | 全功能实现                                       |
| 审图规划     | MVP  | LangChain + DeepSeek                             |
| 规范查询     | MVP  | Coze 工作流 API                                  |
| 专家匹配     | MVP  | Coze 工作流 API                                  |
| 知识库上传   | MVP  | 管理员功能，上传到 Coze 知识库                   |
| 其他功能     | 占位 | 仅保留导航菜单项，页面显示"功能开发中"占位内容   |

## Coze 调用规范

- 所有 Coze 工作流调用封装在 `src/lib/coze.ts` 中，通过 API Routes 代理
- 工作流输入/输出格式在 coze.ts 中用 TypeScript 类型明确定义
- API Token / Workflow ID 只存在于后端环境变量，不传递到前端

## DeepSeek 调用规范

- 封装在 `src/lib/deepseek.ts` 中
- 仅用于审图规划功能（解析项目文件 -> 生成审查要点清单）
- 调用走 API Routes，Key 不暴露到前端

## 错误处理规范

- API Routes 统一 try-catch 包裹，返回标准错误格式
- 前端用 shadcn 的 Sonner 组件显示通知
- 数据库操作错误：区分"用户无权限"、"数据不存在"、"系统错误"
- AI API 调用失败：前端显示"服务暂不可用，请稍后重试"，后端记录详细错误
