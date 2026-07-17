const fs = require("fs");
const fpath = "D:\\codex-project\\shenxiaozu-demo\\src\\app\\api\\review\\generate\\route.ts";
let content = fs.readFileSync(fpath, "utf-8");

// Build the replacement
const newPromptBlock = `const matchPrompt = ChatPromptTemplate.fromTemplate(\`
你是一位建筑工程审查专家。请根据以下项目信息，从提供的规范列表中选出所有与该项目相关的规范。

项目信息：
{project_context}

规范列表：
{regulation_list}

选择规则：
1. 优先选择备注列为"所有项目必选"的规范
2. 根据建筑类型、高度分类、防火分类、结构形式、抗震设防烈度等匹配
3. 根据涉及的专项设计匹配
4. 注意审图专业

请只返回 JSON 数组，不要输出任何其他文字：
[
  {{ "code_number": "规范编号", "code_name": "规范全称", "reason": "选择理由" }},
  ...
]

如果没有任何相关规范，返回空数组 []。
\`);`;

// Find old matchPrompt
const oldKeyword = "const matchPrompt = ChatPromptTemplate.fromTemplate(";
const startIdx = content.indexOf(oldKeyword);
const endKeyword = "如果没有任何相关规范，返回空数组 []。\n\`);";
const endIdx = content.indexOf(endKeyword, startIdx);
if (endIdx > 0) {
  const endPos = endIdx + endKeyword.length;
  content = content.substring(0, startIdx) + newPromptBlock + content.substring(endPos);
  fs.writeFileSync(fpath, content, "utf-8");
  console.log("Fixed successfully");
} else {
  console.log("Could not find end marker");
}