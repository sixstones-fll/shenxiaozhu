# 审小助 — Coze 工作流 API 规范

> 本文档记录 Coze 工作流的输入输出参数规范，供开发时参考。

## 1. 规范查询工作流

- **ID**: `COZE_WORKFLOW_CODE_QUERY_ID`
- **用途**: 用户输入问题，返回相关规范条文

### 输入参数
```json
{
  "query": "用户的问题文本"
}
```

### 返回结构
```json
{
  "results": [
    {
      "code_number": "GB 500xx-20xx",
      "code_name": "规范名称",
      "article_number": "第x.x条",
      "content": "条文内容",
      "relevance_score": 0.95
    }
  ]
}
```

## 2. 专家匹配工作流

- **ID**: `COZE_WORKFLOW_EXPERT_MATCH_ID`
- **用途**: 基于问题推荐 TOP-3 专家

### 输入参数
```json
{
  "query": "用户的问题或项目描述"
}
```

### 返回结构
```json
{
  "experts": [
    {
      "name": "专家姓名",
      "title": "职称",
      "specialty": "专业领域",
      "experience": "从业年限",
      "match_reason": "匹配理由"
    }
  ]
}
```

> **注意**: 以上输入输出格式为项目预期，实际格式需根据 Coze 工作流的实际配置确认。
