# 审小助 Demo — 开发进度

## 项目概述
- **产品**：审小助 — 建筑工程施工图审查助手 Demo（AIPM 面试用）
- **工作目录**：`D:\codex-project\shenxiaozu-demo`
- **技术栈**：Next.js 14 + Supabase + Coze + DeepSeek V4 Flash + Tailwind CSS + shadcn/ui
- **部署**：Vercel（*.vercel.app 域名，无需备案）

## 当前状态（2026-07-17）

### ✅ 已完成

#### 1. 项目初始化
- [x] Next.js 14 App Router 项目搭建
- [x] Tailwind CSS + shadcn/ui 配置（白色底 + 蓝色点缀主题）
- [x] Supabase 集成（Auth + 数据库 + RLS）
- [x] DeepSeek API 集成（.env 配置）
- [x] Coze 工作流 API 集成（.env 配置）

#### 2. 数据库 Schema
- [x] profiles（用户表）
- [x] projects（项目表）
- [x] code_regulations（规范知识库表）
- [x] history_issues（历史问题库表）
- [x] employee_contacts（员工联系表）
- [x] RLS 策略配置

#### 3. 用户系统
- [x] 邮箱登录/注册（Supabase Auth）
- [x] Session 管理
- [x] 路由保护中间件
- [x] 退出登录功能

#### 4. 项目创建（MVP）
- [x] 新建项目页面（上传 Word / 暂不上传）
- [x] Word 文件上传 + DeepSeek 提取项目信息
- [x] 可编辑项目信息表单（项目名称、编号、建筑类型等）
- [x] 审图专业选择（默认建筑）
- [x] "确认生成" 按钮（调用 DeepSeek 生成审图清单）
- [x] "点击下载" 按钮（生成并下载 Word 文档）

#### 5. 审图规划（MVP）
- [x] 规范册检索（按审图专业 → 必选规范 → 按建筑类型适配 → 语义匹配）
- [x] 高频问题检索（按审图专业 + 建筑类型聚类统计，返回频次>3的问题）
- [x] 右侧栏预览（规范清单5条 + "查看更多"、高频问题全部）
- [x] Word 下载

#### 6. 知识问答 — 规范查询（MVP）
- [x] Coze 工作流集成（知识问答工作流，ID: 7661612560530554890）
- [x] DeepSeek 降级备用
- [x] 规范结构化解析（查看详情边栏）
- [x] 意图识别路由（关键词匹配规范查询/专家匹配）

#### 7. 知识问答 — 专家匹配（MVP）
- [x] DeepSeek 问题特征提取（专业 + 关键词）
- [x] 历史问题库相似度匹配
- [x] 员工联系表查询（图审人 + 设计人）
- [x] 智能话术生成（推荐专家 + 开场白）
- [x] 追问查规范链路
- [x] 专家结构化展示（查看详情边栏）

#### 8. 数据导入
- [x] 规范知识库（册）导入 Supabase
- [x] 历史问题库导入 Supabase
- [x] 员工联系表导入 Supabase

#### 9. UI 编码修复
- [x] `projects/page.tsx` 中文字符编码修复
- [x] `layout.tsx` 中文字符编码修复
- [x] 查看详情边栏组件（规范卡片 + 专家卡片）

### 🔧 进行中

- [ ] 知识库上传管理（管理员功能，MVP）
- [ ] 非 MVP 占位页（报告生成、报告对比、问题追踪）
- [ ] Vercel 部署
- [ ] Coze 图片上传接口集成

### 📋 待办

#### 短期（当前 Sprint）
1. ✅ 完成查看详情边栏功能（编码已修复）
2. 修复知识问答 Coze 返回格式显示问题
3. 补充异常状态处理（空数据、网络错误等）

#### 中期（下个 Sprint）
1. 知识库管理页面（管理员上传文件到 Coze）
2. 项目管理页面（项目列表、编辑、删除）

#### 长期
1. 报告生成、报告对比、问题追踪占位页
2. Vercel 部署配置与环境变量
3. 图片上传与识别能力
4. 性能优化（Coze 超时处理）

## 已知问题
1. Coze 规范查询返回格式需要更好的结构化显示
2. 上传文件部分复用链路需要优化
3. 查看详情边栏需要在实际会话中验证

## 关键文件路径
| 文件 | 说明 |
|------|------|
| `src/app/(dashboard)/projects/page.tsx` | 知识问答面板 + 查看详情边栏 |
| `src/app/api/expert-match/route.ts` | 专家匹配 API |
| `src/app/api/coze/chat/route.ts` | 统一对话 API（意图识别 + 路由） |
| `src/app/(dashboard)/layout.tsx` | 主应用布局（侧边栏 + 顶栏） |
| `src/components/shared/UserMenu.tsx` | 用户下拉菜单（含退出登录） |
| `src/lib/coze.ts` | Coze 工作流调用封装 |
| `src/lib/supabase/` | Supabase 客户端/服务端 SDK |
| `data/` | Excel 数据文件（规范库、历史问题库、员工联系表） |
| `.env` | API Keys（DeepSeek/Coze/Supabase） |