$content = "# 审小助 Demo 项目进度

> 最后更新：2026-07-14 | 阶段：Phase 6 审图规划功能（DeepSeek 规范匹配 + 历史高频问题）

## 已完成

### 审图规划功能 — 确认生成
- 后端 API: POST /api/review/generate
  - 从 Supabase 查询规范知识库（册）44 条规范
  - DeepSeek V4 Flash 做语义匹配（精简 prompt，只传三列）
  - 一次调用约 1000 tokens，成本约 ¥0.001
- 历史高频问题查询
  - 按审图专业 + 建筑类型关键词匹配
  - 关键词映射（多层公共建筑（教育建筑）-> 学校）
  - JS 端频次统计，仅显示出现次数 > 3 的问题
  - 每条附带随机样本：问题描述 + 规范要求
- 前端交互
  - 点击确认生成调 API 加载数据
  - 左右分栏布局：左侧项目信息只读，右侧要点展示
  - 规范清单卡片（默认5条，可查看更多展开全部）
  - 高频问题卡片（显示全部 > 3 次的问题）
  - 下载按钮（生成纯文本清单文件）

### 数据准备
- 审小助-规范.xlsx -> Supabase code_regulations 表（44条）
- 审小助-历史问题库.xlsx -> Supabase history_issues 表（55条）
- 数据库权限：GRANT SELECT TO service_role

### 提取信息增加审图专业字段
- deepseek.ts 接口 + prompt 增加审图专业字段
- UI 上确保在项目信息最后一行，默认值建筑专业

### 数据库修复
- Supabase RLS 策略优化，code_regulations / history_issues 关闭 RLS

## 预览链接
http://localhost:3008

## 下一步
1. Coze 规范查询工作流对接
2. Coze 专家匹配工作流对接
3. 知识库上传管理功能（管理员）
4. Vercel 部署
"
$content | Out-File -FilePath "D:\codex-project\shenxiaozu-demo\progress.md" -Encoding utf8
Write-Host "progress.md 已更新"
