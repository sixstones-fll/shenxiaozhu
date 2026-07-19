import { NextRequest, NextResponse } from "next/server";
import mammoth from "mammoth";

export const maxDuration = 120;

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

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    if (!file) {
      return NextResponse.json({ success: false, error: "请上传报告文件" }, { status: 400 });
    }
    const text = await extractText(file);
    if (!text.trim()) {
      return NextResponse.json({ success: false, error: "无法读取文件内容" }, { status: 400 });
    }
    const ep = process.env.DEEPSEEK_API_ENDPOINT || "https://api.deepseek.com";
    const key = process.env.DEEPSEEK_API_KEY || "";
    const model = process.env.DEEPSEEK_MODEL || "deepseek-v4-flash";
    const prompt = `你是一个建筑工程施工图审查报告解析专家。以下是报告文本，请从中提取所有问题条目。

每条问题包含：问题描述、图号、图名、违反条文、严重级（一类强条/二类强条/普通）、涉及专业（建筑专业/结构专业/给排水专业/暖通专业/电气专业，可多选，用数组表示）。

只返回一个JSON数组（不要其他内容），格式：
[{ "description": "问题描述", "drawingNo": "图号", "drawingName": "图名", "violation": "违反条文", "severity": "严重级", "specialty": ["涉及专业1", "涉及专业2"] }]

如果无法提取任何问题，返回空数组 []。

报告内容：
${text.substring(0, 15000)}`;

    const r = await fetch(ep + "/v1/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", "Authorization": "Bearer " + key },
      body: JSON.stringify({ model, messages: [{ role: "user", content: prompt }], temperature: 0.05, max_tokens: 8000 }),
    });
    if (!r.ok) {
      return NextResponse.json({ success: false, error: "服务暂不可用" }, { status: 500 });
    }
    const data = await r.json();
    const content = data.choices?.[0]?.message?.content || "[]";
    let parsed;
    try {
      const m = content.match(/\[[\s\S]*\]/);
      parsed = m ? JSON.parse(m[0]) : JSON.parse(content);
      if (!Array.isArray(parsed)) parsed = [];
    } catch { parsed = []; }
    return NextResponse.json({ success: true, data: parsed });
  } catch (e) {
    console.error("[IMPORT] API error:", e);
    return NextResponse.json({ success: false, error: "服务暂不可用" }, { status: 500 });
  }
}