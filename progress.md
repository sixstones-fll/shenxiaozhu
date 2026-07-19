# 审小助 Demo — 开发进度

## 项目概述
- **产品**：审小助 — 建筑工程施工图审查助手 Demo（AIPM 面试用）
- **工作目录**：D:\codex-project\shenxiaozu-demo
- **端口**：http://localhost:3048
- **技术栈**：Next.js 14 + Supabase + Coze + DeepSeek V4 Flash + Tailwind CSS + shadcn/ui
- **GitHub**：github.com/sixstones-fll/shenxiaozhu（master 分支）

## 当前状态（2026-07-17）

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
- [x] 规范册检索（按专业 → 必选 → 按建筑类型 → 语义匹配）
- [x] 高频问题检索（按专业 + 建筑类型聚类，频次>=3）
- [x] 右侧栏预览 + Word 下载

#### 6. 知识问答 — 规范查询（MVP）
- [x] Coze 工作流集成 + DeepSeek 降级备用
- [x] 规范结构化解析（查看详情边栏）
- [x] 意图识别路由

#### 7. 知识问答 — 专家匹配（MVP）
- [x] DeepSeek 特征提取 + 历史问题库匹配 + 员工联系表查询
- [x] 智能话术生成 + 追问查规范链路
- [x] 专家结构化展示（微信图标 + 复制话术）

#### 8. 报告生成（MVP）— 新增
- [x] 独立组件 src/features/report/ReportPanel.tsx
- [x] 独立 API src/app/api/report/transcribe/route.ts
- [x] 逐条录入问题表格（序号、问题描述、图号、图名、违反条文、严重级、涉及专业、截图、操作）
- [x] 点击序号高亮 → 激活底部输入框
- [x] DeepSeek 转写（输入问题描述 → 自动匹配条文、严重级、专业）
- [x] 导出报告（docx / CSV 降级）
- [x] sessionStorage 持久化

#### 9. 知识问答体验修复
- [x] 用户消息靠右（头像在右边缘、气泡在左）
- [x] AI 消息靠左（头像在左边缘、气泡在右）
- [x] 规范查询后追问"是否需要推荐相关专家？"
- [x] 专家匹配后追问"是否需要查询相关规范？"
- [x] 底栏固定在浏览器底部，不随滚动消失

#### 10. 重构与修复
- [x] 拆分 expert-match 为独立 lib 模块
- [x] 标签隔离：ReviewPanel / KnowledgeQAPanel / ReportPanel 各自独立
- [x] page.tsx 瘦身为标签切换壳子

### 🔄 进行中
- [ ] 知识库上传管理（管理员功能，MVP）
- [ ] Vercel 部署
- [ ] 剩余占位标签（报告对比、问题追踪）

### 📵 待办

#### 短期
1. 知识库管理页面（管理员上传文件）
2. 项目管理页面（列表、编辑、删除）

#### 长期
1. 报告对比、问题追踪占位页
2. Vercel 部署配置
3. 图片识别功能

## 文件架构
| 路径 | 说明 |
|------|------|
| src/features/review/ReviewPanel.tsx | 审图规划（独立） |
| src/features/knowledge/KnowledgeQAPanel.tsx | 知识问答（独立） |
| src/features/report/ReportPanel.tsx | 报告生成（独立） |
| src/app/api/coze/chat/route.ts | 统一对话 API |
| src/app/api/report/transcribe/route.ts | 报告转写 API |
| src/app/api/expert-match/route.ts | 专家匹配 API |
| src/app/(dashboard)/projects/page.tsx | 标签切换壳子 |
| src/lib/expert-match.ts | 专家匹配核心逻辑 |
| data/ | Excel 数据文件 |

## 已知问题
1. Coze 额度不足时规范查询降级到 DeepSeek，格式不一致
2. 部分文件权限需要管理员身份运行
3. Build Error 偶发（代码编辑时 JSX 闭合问题）
## 当前状态（2026-07-19）

#### 10. 报告生成标签 — 功能扩展
- [x] 修复表头列对齐（添加\"问题回复\"和\"整改状态\"列）
- [x] 涉及专业改为多选（建筑/结构/水/暖/电），显示短名
- [x] 添加问题回复输入列 + 整改状态下拉列
- [x] 添加导入报告功能（上传docx自动解析）
- [x] 导出Word/CSV包含新增列
- [x] 底部输入框支持回复转写模式
- [x] IssuesRow接口更新：specialty→string[]，新增reply/status
- [x] sessionStorage数据迁移兼容
