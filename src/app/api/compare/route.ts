import { NextRequest, NextResponse } from "next/server";
import mammoth from "mammoth";

export const maxDuration = 180;

async function extractText(file: File): Promise<string> {
  const buffer = Buffer.from(await file.arrayBuffer());
  if (file.name.endsWith(".docx") || (buffer[0] === 0x50 && buffer[1] === 0x4B)) {
    try {
      const result = await mammoth.extractRawText({ buffer });
      return result.value || "";
    } catch { return ""; }
  }
  return buffer.toString("utf-8");
}

async function parseReport(text: string, label: string): Promise<any[]> {
  const ep = process.env.DEEPSEEK_API_ENDPOINT || "https://api.deepseek.com";
  const key = process.env.DEEPSEEK_API_KEY || "";
  const model = process.env.DEEPSEEK_MODEL || "deepseek-v4-flash";
  const prompt = `你是一个建筑工程施工图审查报告解析专家。以下是一份审查报告的文本内容，请从中提取所有问题条目。

每条问题包含：问题描述、图号（如果没找到就填空字符串）、图名（如果没找到就填空字符串）、违反条文（如果没找到就填空字符串）、严重级（一类强条/二类强条/普通，无法判断就填"普通"）、涉及专业（建筑专业/结构专业，无法判断就填"建筑专业"）。

只返回一个JSON数组（不要其他内容），格式：
[{ "description": "问题描述", "drawingNo": "图号", "drawingName": "图名", "violation": "违反条文", "severity": "严重级", "specialty": "涉及专业" }]

如果无法提取任何问题，返回空数组 []。

报告内容：
${text.substring(0, 20000)}`;

  const r = await fetch(ep + "/v1/chat/completions", {
    method: "POST",
    headers: { "Content-Type": "application/json", "Authorization": "Bearer " + key },
    body: JSON.stringify({ model, messages: [{ role: "user", content: prompt }], temperature: 0.05, max_tokens: 8000 }),
  });
  if (!r.ok) return [];
  const data = await r.json();
  const content = data.choices?.[0]?.message?.content || "[]";
  try {
    const m = content.match(/\[[\s\S]*\]/);
    return m ? JSON.parse(m[0]) : [];
  } catch { return []; }
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const oldFile = formData.get("oldReport") as File | null;
    const newFile = formData.get("newReport") as File | null;
    if (!oldFile || !newFile) {
      return NextResponse.json({ success: false, error: "请上传两份报告" }, { status: 400 });
    }
    const [oldText, newText] = await Promise.all([extractText(oldFile), extractText(newFile)]);
    if (!oldText.trim() || !newText.trim()) {
      return NextResponse.json({ success: false, error: "无法读取报告内容" }, { status: 400 });
    }
    // Step 1: Parse both reports into structured issue lists
    const [oldIssues, newIssues] = await Promise.all([
      parseReport(oldText, "旧版"),
      parseReport(newText, "新版"),
    ]);
    if (oldIssues.length === 0 && newIssues.length === 0) {
      return NextResponse.json({ success: true, data: { summary: { resolved: 0, new: 0, pending: 0 }, conclusion: "两份报告中均未提取到问题条目，请确认报告格式正确", details: [] } });
    }
    // Step 2: Compare using DeepSeek with structured JSON input
    const ep = process.env.DEEPSEEK_API_ENDPOINT || "https://api.deepseek.com";
    const key = process.env.DEEPSEEK_API_KEY || "";
    const model = process.env.DEEPSEEK_MODEL || "deepseek-v4-flash";
    const comparePrompt = `你是一个建筑工程施工图审查报告对比专家。我有两份报告的问题列表（JSON格式），请逐条对比。

旧版报告问题列表：
${JSON.stringify(oldIssues, null, 2)}

新版报告问题列表：
${JSON.stringify(newIssues, null, 2)}

对比规则：
1. 以"问题描述"为主要匹配字段（允许微小差异），图号+图名为辅助匹配
2. 旧版有、新版没有 → 状态标记为"已整改"
3. 旧版没有、新版有 → 状态标记为"新增"
4. 新旧版都有（匹配上） → 状态标记为"待整改"

只返回JSON格式（不要其他内容）：
{
  "summary": { "resolved": 数量, "new": 数量, "pending": 数量 },
  "conclusion": "对比结论文本",
  "details": [
    { "id": "序号", "description": "问题描述", "drawingNo": "图号", "drawingName": "图名", "violation": "违反条文", "severity": "严重级", "status": "已整改/新增/待整改" }
  ]
}`;

    const r2 = await fetch(ep + "/v1/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", "Authorization": "Bearer " + key },
      body: JSON.stringify({ model, messages: [{ role: "user", content: comparePrompt }], temperature: 0.05, max_tokens: 8000 }),
    });
    if (!r2.ok) return NextResponse.json({ success: false, error: "服务暂不可用" }, { status: 500 });
    const data2 = await r2.json();
    const content2 = data2.choices?.[0]?.message?.content || "";
    let parsed;
    try {
      const m = content2.match(/\{[\s\S]*\}/);
      parsed = m ? JSON.parse(m[0]) : JSON.parse(content2);
    } catch {
      return NextResponse.json({ success: true, data: { summary: { resolved: 0, new: 0, pending: 0 }, conclusion: "对比完成，但未能解析结构化结果", details: [], raw: content2.substring(0, 1000) } });
    }
    return NextResponse.json({ success: true, data: parsed });
  } catch (e) {
    console.error("[COMPARE] API error:", e);
    return NextResponse.json({ success: false, error: "服务暂不可用" }, { status: 500 });
  }
}
