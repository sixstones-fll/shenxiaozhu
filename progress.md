# 审小助 Demo — 开发进度

## 项目概述
- **产品**：审小助 — 建筑工程施工图审查助手 Demo（AIPM 面试用）
- **工作目录**：D:\codex-project\shenxiaozu-demo
- **技术栈**：Next.js 14 + Supabase + Coze + DeepSeek V4 Flash + Tailwind CSS + shadcn/ui
- **GitHub**：github.com/sixstones-fll/shenxiaozhu（master 分支）
- **Vercel**：https://sixstones-fll-shenxiaozhu.vercel.app

## 当前状态（2026-07-20）

### ✅ 已完成

#### 1. 项目初始化
- [x] Next.js 14 App Router 项目搭建
- [x] Tailwind CSS + shadcn/ui 配置（白色底 + 蓝色点缀主题）
- [x] Supabase 集成（Auth + 数据库 + RLS）
- [x] DeepSeek API + Coze 工作流 API 集成

#### 2. 数据库 & 数据
- [x] 建表：profiles / projects / code_regulations / history_issues / employee_contacts
- [x] RLS 策略配置
- [x] Excel 数据导入 Supabase（规范库、历史问题库、员工联系表）

#### 3. 用户系统
- [x] 邮箱登录/注册（Supabase Auth）
- [x] Session 管理 + 路由保护中间件
- [x] 退出登录功能

#### 4. 项目创建（MVP）
- [x] 新建项目页面（上传 Word 提取信息 / 暂不上传直接创建）
- [x] Word 上传 + DeepSeek 提取项目信息（字段可编辑）
- [x] 审图专业选择 + 确认生成 + Word 下载

#### 5. 审图规划（MVP）
- [x] 三态渲染：上传界面 → 四列布局 → 左右分栏
- [x] 规范册检索（按专业 → 必选 → 按建筑类型 → 语义匹配）
- [x] 高频问题检索（按专业 + 建筑类型聚类，频次>=3）
- [x] 右侧栏预览 + Word 下载

#### 6. 知识问答（MVP）
- [x] Coze 工作流集成 + DeepSeek 降级备用
- [x] 规范查询 + 专家匹配双链路
- [x] 意图识别路由 + 追问交互
- [x] 用户/AI 头像分列两侧（用户靠右，AI 靠左）
- [x] 输入框固定在底部

#### 7. 报告生成（MVP）
- [x] 逐条录入问题表格（序号/描述/图号/图名/条文/严重级/专业/截图/操作）
- [x] 转写：输入问题描述 → 自动匹配条文、严重级、专业
- [x] 导入/导出报告
- [x] 添加问题回复 + 整改状态列
- [x] 涉及专业多选（建筑/结构/水/暖/电）

#### 8. 报告对比（MVP）
- [x] 双报告上传（新版/旧版）
- [x] DeepSeek 对比分析（已整改/新增/待整改）
- [x] 统计 + 结论 + 详情边栏

#### 9. 问题追踪（MVP）
- [x] 整改状态统计（总问题/已整改/未整改）
- [x] 风险等级统计（一类强条/二类强条/普通）
- [x] 跨专业问题分布（建筑/结构/水/暖/电）
- [x] 各专业负责人联系方式（假数据）
- [x] 点击卡片弹出详情边栏

#### 10. 项目管理（假数据）
- [x] 项目列表 + 搜索 + A-Z 字母筛选 + 建筑类型筛选
- [x] 四列表格：项目名称/建筑类型/创建时间/操作
- [x] 新建项目自动同步到项目管理列表

#### 11. 知识库管理
- [x] 三步向导：导入数据 → 数据配置 → 完成
- [x] 三种分段方式：自动分段/自定义分段/按等级分段
- [x] 查看规范库：搜索 + A-Z 筛选 + 查看详情按钮
- [x] 查看问题库：搜索 + A-Z 筛选 + 详情边栏（假数据）

#### 12. Vercel 部署
- [x] GitHub 仓库连接 Vercel
- [x] 环境变量配置
- [x] 修复 tailwind.config.ts content 路径（添加 ./src/features）
- [x] 修复旧 ReviewPanel.tsx JSX 语法错误
- [x] next.config 添加 typescript.ignoreBuildErrors

### 文件架构

| 路径 | 说明 |
|------|------|
| src/features/review/ReviewPanel.tsx | 审图规划 |
| src/features/knowledge/KnowledgeQAPanel.tsx | 知识问答 |
| src/features/report/ReportPanel.tsx | 报告生成 |
| src/features/compare/ComparePanel.tsx | 报告对比 |
| src/features/issues/IssueTrackingPanel.tsx | 问题追踪 |
| src/features/project-manage/ProjectManagePanel.tsx | 项目管理 |
| src/features/knowledge-base/KnowledgeBasePanel.tsx | 知识库管理 |
| src/features/knowledge-base/UploadView.tsx | 知识库上传 |
| src/app/(dashboard)/projects/page.tsx | 标签切换壳子 |
| src/lib/expert-match.ts | 专家匹配核心逻辑 |
| data/ | Excel 数据文件 |

### 已知问题
1. Coze 额度不足时规范查询降级到 DeepSeek，格式不一致
2. Vercel 生产构建需确保环境变量全部正确配置
3. 部分类型错误被 next.config 的 ignoreBuildErrors 忽略
