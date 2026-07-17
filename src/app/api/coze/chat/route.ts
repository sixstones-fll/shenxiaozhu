// /api/coze/chat - 统一对话 API（意图识别 + 路由）
import { NextRequest, NextResponse } from "next/server";
import { matchExperts } from "@/lib/expert-match";

export const maxDuration = 300;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { question, expertOnly } = body;
    if (!question || typeof question !== "string" || question.trim().length === 0) {
      return NextResponse.json({ success: false, error: "请输入问题" }, { status: 400 });
    }
    const trimmed = question.trim();
    if (expertOnly === true) {
      const cleanQ = trimmed.replace(/需要|推荐|哪个|专家|规范|条文|规定|标准/g, "").trim();
      const result = await routeToCodeQuery(cleanQ || trimmed);
      return NextResponse.json(result);
    }
    const intent = identifyIntentFromKeywords(trimmed);
    console.log("[CHAT] intent:", intent, "question:", trimmed.substring(0, 50));
    if (intent === "expert_match") {
      const result = await routeToExpertMatch(trimmed);
      return NextResponse.json(result);
    } else {
      const result = await routeToCodeQuery(trimmed);
      return NextResponse.json(result);
    }
  } catch (error) {
    console.error("Chat API error:", error.message, error.stack);
    return NextResponse.json({ success: false, error: "服务暂不可用，请稍后重试" }, { status: 500 });
  }
}

function identifyIntentFromKeywords(question) {
  const expertKeywords = ["专家", "推荐", "找谁", "问谁", "哪位", "哪个", "擅长", "匹配", "谁负责", "找哪个", "联系人", "找哪位", "推荐问", "哪个专家", "帮我找", "介绍", "负责人", "联系方式", "联系"];
  if (expertKeywords.some((k) => question.includes(k))) return "expert_match";
  return "code_query";
}

async function routeToExpertMatch(question) {
  console.log("[DEBUG] routeToExpertMatch called with:", question.substring(0, 100));
  try {
    const result = await matchExperts(question);
    console.log("[CHAT] expert match result:", JSON.stringify(result).substring(0, 500));
    console.log("[DEBUG] expert match result:", JSON.stringify(result).substring(0, 300));
    return result;
  } catch (e) {
    console.error("Expert match error:", e);
    return { success: true, type: "expert_match", data: "服务暂不可用，请稍后重试", askFollowUp: false, detail: null };
  }
}

async function routeToCodeQuery(question) {
  console.log("[DEBUG] routeToCodeQuery called with:", question.substring(0, 100));
  const workflowId = process.env.COZE_WORKFLOW_CODE_QUERY_ID;
  let rawOutput = "";

  if (workflowId) {
    const { runWorkflow } = await import("@/lib/coze");
    const result = await runWorkflow(workflowId, { input: question });
    if (result.success && result.data && result.data.code === 0) {
      const rawData = result.data;
      if (rawData.data) {
        if (typeof rawData.data === "string") {
          try { const parsed = JSON.parse(rawData.data); rawOutput = parsed.output || parsed.content || rawData.data; } catch { rawOutput = rawData.data; }
        } else if (typeof rawData.data === "object") {
          rawOutput = rawData.data.output || rawData.data.content || JSON.stringify(rawData.data);
        }
      }
      if (!rawOutput) rawOutput = rawData.output || rawData.msg || "";
    } else {
      if (result.data) {
        console.error("[Coze] error code:", result.data.code, "msg:", result.data.msg);
      }
    }
  }

  if (!rawOutput) {
    const ep = process.env.DEEPSEEK_API_ENDPOINT || "https://api.deepseek.com";
    const key = process.env.DEEPSEEK_API_KEY || "";
    const model = process.env.DEEPSEEK_MODEL || "deepseek-v4-flash";
    try {
      const response = await fetch(ep + "/v1/chat/completions", {
        method: "POST",
        headers: { "Content-Type": "application/json", "Authorization": "Bearer " + key },
        body: JSON.stringify({ model, messages: [{ role: "system", content: "你是一个建筑工程施工图审查规范查询助手。请根据用户问题，提供相关的国家规范、标准要求，并给出具体的条文编号和设计要求。回答要专业、准确、简洁。" }, { role: "user", content: question }], temperature: 0.1, max_tokens: 2000 }),
      });
      const data = await response.json();
      rawOutput = data.choices?.[0]?.message?.content || "查询无结果";
    } catch (e) {
      return { success: true, type: "code_query", data: "服务暂不可用，请稍后重试", detail: null };
    }
  }

  const detail = await parseCodeRules(rawOutput);
  return { success: true, type: "code_query", data: rawOutput, detail: detail || null, askFollowUp: true };
}

async function parseCodeRules(text) {
  const ep = process.env.DEEPSEEK_API_ENDPOINT || "https://api.deepseek.com";
  const key = process.env.DEEPSEEK_API_KEY || "";
  const model = process.env.DEEPSEEK_MODEL || "deepseek-v4-flash";
  try {
    const response = await fetch(ep + "/v1/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", "Authorization": "Bearer " + key },
      body: JSON.stringify({
        model,
        messages: [{ role: "system", content: "从以下规范回答文本中提取每条规范的结构化信息。返回JSON数组，每项包含：codeName（规范名称）、codeId（条文编号）、requirement（核心要求，20字以内）、detail（详细说明）、tips（要点解读：说明该规范在实际设计中容易踩坑的点，30字以内）。如果有多条规范，就提取多条。只返回JSON数组，不要其他内容。" }, { role: "user", content: text }],
        temperature: 0,
        max_tokens: 2000,
      }),
    });
    if (!response.ok) return null;
    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || "[]";
    const parsed = JSON.parse(content);
    if (Array.isArray(parsed) && parsed.length > 0) return { type: "code_query", rules: parsed };
    return null;
  } catch (e) { return null; }
}

