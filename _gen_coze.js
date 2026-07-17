const fs = require("fs");

const content = // /api/coze/chat - 统一对话 API（意图识别 + 路由）
import { NextRequest, NextResponse } from "next/server";
import { matchExperts } from "@/lib/expert-match";

export const maxDuration = 300;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { question, expertOnly } = body;
    if (!question || typeof question !== "string" || question.trim().length === 0) {
      return NextResponse.json({ success: false, error: "\u8bf7\u8f93\u5165\u95ee\u9898" }, { status: 400 });
    }
    const trimmed = question.trim();
    if (expertOnly === true) {
      const cleanQ = trimmed.replace(/\u9700\u8981|\u63a8\u8350|\u54ea\u4e2a|\u4e13\u5bb6|\u89c4\u8303|\u6761\u6587|\u89c4\u5b9a|\u6807\u51c6/g, "").trim();
      const result = await routeToCodeQuery(cleanQ || trimmed);
      return NextResponse.json(result);
    }
    const intent = identifyIntentFromKeywords(trimmed);
    if (intent === "expert_match") {
      const result = await routeToExpertMatch(trimmed);
      return NextResponse.json(result);
    } else {
      const result = await routeToCodeQuery(trimmed);
      return NextResponse.json(result);
    }
  } catch (error) {
    console.error("Chat API error:", error.message, error.stack);
    return NextResponse.json({ success: false, error: "\u670d\u52a1\u6682\u4e0d\u53ef\u7528\uff0c\u8bf7\u7a0d\u540e\u91cd\u8bd5" }, { status: 500 });
  }
}

function identifyIntentFromKeywords(question) {
  const expertKeywords = ["\u4e13\u5bb6", "\u63a8\u8350", "\u627e\u8c01", "\u95ee\u8c01", "\u54ea\u4f4d", "\u54ea\u4e2a", "\u64c5\u957f", "\u5339\u914d", "\u8c01\u8d1f\u8d23", "\u627e\u54ea\u4e2a", "\u8054\u7cfb\u4eba", "\u627e\u54ea\u4f4d", "\u63a8\u8350\u95ee", "\u54ea\u4e2a\u4e13\u5bb6", "\u5e2e\u6211\u627e", "\u4ecb\u7ecd", "\u8d1f\u8d23\u4eba", "\u8054\u7cfb\u65b9\u5f0f", "\u8054\u7cfb"];
  if (expertKeywords.some((k) => question.includes(k))) return "expert_match";
  return "code_query";
}

async function routeToExpertMatch(question) {
  console.log("[DEBUG] routeToExpertMatch called with:", question.substring(0, 100));
  try {
    const result = await matchExperts(question);
    console.log("[DEBUG] expert match result:", JSON.stringify(result).substring(0, 300));
    return result;
  } catch (e) {
    console.error("Expert match error:", e);
    return { success: true, type: "expert_match", data: "\u670d\u52a1\u6682\u4e0d\u53ef\u7528\uff0c\u8bf7\u7a0d\u540e\u91cd\u8bd5", askFollowUp: false, detail: null };
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
        body: JSON.stringify({ model, messages: [{ role: "system", content: "\u4f60\u662f\u4e00\u4e2a\u5efa\u7b51\u5de5\u7a0b\u65bd\u5de5\u56fe\u5ba1\u67e5\u89c4\u8303\u67e5\u8be2\u52a9\u624b\u3002\u8bf7\u6839\u636e\u7528\u6237\u95ee\u9898\uff0c\u63d0\u4f9b\u76f8\u5173\u7684\u56fd\u5bb6\u89c4\u8303\u3001\u6807\u51c6\u8981\u6c42\uff0c\u5e76\u7ed9\u51fa\u5177\u4f53\u7684\u6761\u6587\u7f16\u53f7\u548c\u8bbe\u8ba1\u8981\u6c42\u3002\u56de\u7b54\u8981\u4e13\u4e1a\u3001\u51c6\u786e\u3001\u7b80\u6d01\u3002" }, { role: "user", content: question }], temperature: 0.1, max_tokens: 2000 }),
      });
      const data = await response.json();
      rawOutput = data.choices?.[0]?.message?.content || "\u67e5\u8be2\u65e0\u7ed3\u679c";
    } catch (e) {
      return { success: true, type: "code_query", data: "\u670d\u52a1\u6682\u4e0d\u53ef\u7528\uff0c\u8bf7\u7a0d\u540e\u91cd\u8bd5", detail: null };
    }
  }

  const detail = await parseCodeRules(rawOutput);
  return { success: true, type: "code_query", data: rawOutput, detail: detail || null };
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
        messages: [{ role: "system", content: "\u4ece\u4ee5\u4e0b\u89c4\u8303\u56de\u7b54\u6587\u672c\u4e2d\u63d0\u53d6\u6bcf\u6761\u89c4\u8303\u7684\u7ed3\u6784\u5316\u4fe1\u606f\u3002\u8fd4\u56deJSON\u6570\u7ec4\uff0c\u6bcf\u9879\u5305\u542b\uff1acodeName\uff08\u89c4\u8303\u540d\u79f0\uff09\u3001codeId\uff08\u6761\u6587\u7f16\u53f7\uff09\u3001requirement\uff08\u6838\u5fc3\u8981\u6c42\uff0c20\u5b57\u4ee5\u5185\uff09\u3001detail\uff08\u8be6\u7ec6\u8bf4\u660e\uff09\u3001tips\uff08\u8981\u70b9\u89e3\u8bfb\uff1a\u8bf4\u660e\u8be5\u89c4\u8303\u5728\u5b9e\u9645\u8bbe\u8ba1\u4e2d\u5bb9\u6613\u8e29\u5751\u7684\u70b9\uff0c30\u5b57\u4ee5\u5185\uff09\u3002\u5982\u679c\u6709\u591a\u6761\u89c4\u8303\uff0c\u5c31\u63d0\u53d6\u591a\u6761\u3002\u53ea\u8fd4\u56deJSON\u6570\u7ec4\uff0c\u4e0d\u8981\u5176\u4ed6\u5185\u5bb9\u3002\u683c\u5f0f\uff1a[{\\"codeName\\":\\"...\\",\\"codeId\\":\\"...\\",\\"requirement\\":\\"...\\",\\"detail\\":\\"...\\",\\"tips\\":\\"...\\"}]" }, { role: "user", content: text }],
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
;

fs.writeFileSync("D:/codex-project/shenxiaozu-demo/src/app/api/coze/chat/route.ts", content, "utf-8");
console.log("Done: coze/chat/route.ts written");