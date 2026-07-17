import { NextRequest, NextResponse } from "next/server";

export const maxDuration = 60;

export async function POST(request: NextRequest) {
  try {
    const { description } = await request.json();
    if (!description || typeof description !== "string" || description.trim().length === 0) {
      return NextResponse.json({ success: false, error: "请输入问题描述" }, { status: 400 });
    }

    const ep = process.env.DEEPSEEK_API_ENDPOINT || "https://api.deepseek.com";
    const key = process.env.DEEPSEEK_API_KEY || "";
    const model = process.env.DEEPSEEK_MODEL || "deepseek-v4-flash";

    const systemPrompt = `你是一个建筑工程施工图审查专家。根据用户输入的问题描述，提取并结构化以下信息，只返回JSON格式（不要其他内容）：

{
  "description": "问题描述（简洁概括，20字以内）",
  "drawingNo": "图号（如 建施-01）",
  "drawingName": "图名（如 一层平面图）",
  "violation": "违反的规范条文编号及内容",
  "severity": "严重级（只能是一类强条/二类强条/普通之一）",
  "specialty": "涉及专业（只能是建筑专业/结构专业之一）"
}

如果用户输入中没有明确提到图号或图名，根据上下文合理推断。严重级判断标准：
- 一类强条：涉及生命安全、消防、结构安全等强制性条文
- 二类强条：涉及一般强制性条文但后果较严重
- 普通：一般性规范问题或建议`;

    const response = await fetch(ep + "/v1/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", "Authorization": "Bearer " + key },
      body: JSON.stringify({
        model,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: description.trim() },
        ],
        temperature: 0.1,
        max_tokens: 1000,
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error("[REPORT] DeepSeek error:", response.status, errText);
      return NextResponse.json({ success: false, error: "服务暂不可用" }, { status: 500 });
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || "";

    let parsed;
    try {
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        parsed = JSON.parse(jsonMatch[0]);
      } else {
        parsed = JSON.parse(content);
      }
    } catch {
      return NextResponse.json({
        success: true,
        data: {
          description: description.trim().substring(0, 20),
          drawingNo: "",
          drawingName: "",
          violation: content,
          severity: "普通",
          specialty: "建筑专业",
        },
      });
    }

    return NextResponse.json({
      success: true,
      data: {
        description: parsed.description || description.trim().substring(0, 20),
        drawingNo: parsed.drawingNo || "",
        drawingName: parsed.drawingName || "",
        violation: parsed.violation || "",
        severity: parsed.severity || "普通",
        specialty: parsed.specialty || "建筑专业",
      },
    });
  } catch (e) {
    console.error("[REPORT] API error:", e);
    return NextResponse.json({ success: false, error: "服务暂不可用" }, { status: 500 });
  }
}
