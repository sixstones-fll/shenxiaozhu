# 审小助 — 建筑工程施工图审查助手

> 面试用 Demo 项目 | Spec Coding 方式开发

## 产品简介

审小助是一款面向建筑设计行业的施工图审查智能助手，帮助专业负责人、图审人员和设计师高效完成施工图审查工作。

## MVP 功能

| 功能         | 说明                                             |
| ------------ | ------------------------------------------------ |
| 项目创建     | 用户创建项目并上传设计说明文件                     |
| 审图规划     | 解析项目文件，基于 DeepSeek AI 生成审查要点清单   |
| 规范查询     | 对话式检索规范条文（Coze 工作流）                  |
| 专家匹配     | 基于问题推荐 TOP-3 专家（Coze 工作流）            |
| 知识库上传   | 管理员上传文件到 Coze 知识库                      |

## 技术栈

- **前端/后端**: Next.js 14 (App Router) + TypeScript
- **UI**: Tailwind CSS + shadcn/ui
- **数据库/认证**: Supabase (PostgreSQL + Auth + RLS)
- **AI 编排**: LangChain
- **LLM**: DeepSeek V4 Flash
- **知识库 AI**: Coze 工作流 API
- **部署**: Vercel

## 快速开始

```bash
npm install
npm run dev
```

详细开发指引请参考 [CONTRIBUTING.md](./CONTRIBUTING.md)。

## 项目文档

- [AGENTS.md](./AGENTS.md) — 项目架构与开发规范
- [ARCHITECTURE.md](./ARCHITECTURE.md) — 系统架构与数据流
- [CONTRIBUTING.md](./CONTRIBUTING.md) — 开发指引
- [progress.md](./progress.md) — 项目进度
