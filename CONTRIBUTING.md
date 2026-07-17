# 审小助 — 开发指引

> 本文档帮助新开发者快速上手本项目。

## 环境要求

- Node.js >= 18.x（当前使用 v24.15.0）
- npm >= 9.x（当前使用 11.12.1）
- Supabase 账号（已有）
- Coze 账号（已有）
- DeepSeek API Key（已有）

## 快速开始

### 1. 安装依赖

```bash
npm install
```

### 2. 配置环境变量

复制模板文件：

```bash
cp .env.example .env
```

然后编辑 `.env` 填入真实密钥。需要的环境变量：

| 变量名                           | 说明                         |
| -------------------------------- | ---------------------------- |
| NEXT_PUBLIC_SUPABASE_URL         | Supabase 项目 URL            |
| NEXT_PUBLIC_SUPABASE_ANON_KEY    | Supabase 匿名 Key（公开）    |
| SUPABASE_SERVICE_ROLE_KEY        | Supabase 服务角色 Key（保密）|
| DEEPSEEK_API_KEY                 | DeepSeek API Key             |
| DEEPSEEK_API_ENDPOINT            | DeepSeek API 地址            |
| DEEPSEEK_MODEL                   | 模型名（如 deepseek-v4-flash）|
| COZE_API_TOKEN                   | Coze Personal Access Token   |
| COZE_API_ENDPOINT                | Coze API 地址                |
| COZE_WORKFLOW_CODE_QUERY_ID      | 规范查询工作流 ID            |
| COZE_WORKFLOW_EXPERT_MATCH_ID    | 专家匹配工作流 ID            |
| COZE_SPACE_ID                    | Coze 空间 ID                 |

> **注意**: `.env` 已加入 `.gitignore`，不会提交到代码库。

### 3. 初始化数据库

在 Supabase Dashboard → SQL Editor 中执行 `src/lib/db/schema.sql`。

### 4. 启动开发服务器

```bash
npm run dev
```

打开 http://localhost:3000 查看效果。

## 可用脚本

| 命令           | 说明                       |
| -------------- | -------------------------- |
| `npm run dev`  | 启动开发服务器 (localhost)  |
| `npm run build`| 构建生产版本               |
| `npm start`    | 启动生产服务器             |
| `npm run lint` | 运行 ESLint 代码检查       |

## 开发规范

- **TypeScript**: 所有文件使用 TypeScript，严格模式已开启
- **组件**: 优先使用 shadcn/ui 标准组件，自定义组件放在 `src/components/shared/`
- **样式**: 使用 Tailwind CSS，主题色参考 `tailwind.config.ts`
- **API**: 前端通过 API Routes 调用后端逻辑，不直接调用第三方 API
- **数据库**: 通过 Supabase JS SDK 操作，复杂查询使用 raw SQL
- **提交**: 遵循常规提交规范

## 部署

项目部署在 Vercel，使用默认 `*.vercel.app` 域名。

部署步骤：
1. 将代码推送到 GitHub 仓库
2. 在 Vercel 中导入该仓库
3. 配置环境变量（生产环境的 .env）
4. 部署

> 注意：生产环境需要在 Vercel Dashboard 中设置所有环境变量。
