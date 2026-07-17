// Coze 工作流调用封装
// 所有 Coze 调用走后端 API Routes，不暴露 Token 到前端

const COZE_API_ENDPOINT = "https://api.coze.cn/v1/workflow/run";
const COZE_API_TOKEN = process.env.COZE_API_TOKEN || "";

export interface CozeWorkflowInput {
  [key: string]: any;
}

export interface CozeWorkflowResponse {
  success: boolean;
  data?: any;
  error?: string;
}

export async function runWorkflow(
  workflowId: string,
  input: CozeWorkflowInput
): Promise<CozeWorkflowResponse> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5 * 60 * 1000);
    const response = await fetch(COZE_API_ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${COZE_API_TOKEN}`,
      },
      body: JSON.stringify({
        workflow_id: workflowId,
        parameters: input,
        is_async: false,
      }),
      signal: controller.signal,
    });
    clearTimeout(timeoutId);
    if (!response.ok) {
      const errorText = await response.text();
      return { success: false, error: `Coze API error (${response.status}): ${errorText}` };
    }
    const data = await response.json();
    console.log("[Coze sync response]", JSON.stringify(data));
    return { success: true, data };
  } catch (error: any) {
    if (error.name === "AbortError") {
      return { success: false, error: "请求超时，请简化您的问题后重试" };
    }
    return { success: false, error: `Coze API call failed: ${error.message}` };
  }
}

export async function queryRegulations(question: string): Promise<CozeWorkflowResponse> {
  const workflowId = process.env.COZE_WORKFLOW_CODE_QUERY_ID;
  if (!workflowId) {
    return { success: false, error: "COZE_WORKFLOW_CODE_QUERY_ID 未配置" };
  }
  return runWorkflow(workflowId, { input: question });
}

export async function matchExpert(question: string): Promise<CozeWorkflowResponse> {
  const workflowId = process.env.COZE_WORKFLOW_EXPERT_MATCH_ID;
  if (!workflowId) {
    return { success: false, error: "COZE_WORKFLOW_EXPERT_MATCH_ID 未配置" };
  }
  return runWorkflow(workflowId, { input: question });
}

export async function identifyIntentAndRoute(
  question: string
): Promise<{ type: "code_query" | "expert_match"; result: CozeWorkflowResponse }> {
  const intent = await identifyIntent(question);
  if (intent === "expert_match") {
    const result = await matchExpert(question);
    return { type: "expert_match", result };
  } else {
    const result = await queryRegulations(question);
    return { type: "code_query", result };
  }
}

async function identifyIntent(question: string): Promise<"code_query" | "expert_match"> {
  const apiKey = process.env.DEEPSEEK_API_KEY;
  const endpoint = process.env.DEEPSEEK_API_ENDPOINT || "https://api.deepseek.com";
  const model = process.env.DEEPSEEK_MODEL || "deepseek-v4-flash";

  // 专家关键词优先级最高：只要提到就优先走专家匹配
  const expertKeywords = ["专家", "推荐", "找谁", "擅长", "匹配", "谁负责", "找哪个", "联系人", "找哪位", "推荐问", "哪个专家", "帮我找", "介绍", "负责人"];
  const lower = question.toLowerCase();
  const hasExpertKeyword = expertKeywords.some((k) => lower.includes(k));
  if (hasExpertKeyword) return "expert_match";

  // 规范关键词
  const codeKeywords = ["规范", "条文", "规定", "要求", "标准", "防火", "抗震", "条例", "GB", "编号", "多少米", "多少度", "多高", "面积", "栏杆", "防护", "高度", "距离", "间距", "宽度", "厚度", "等级", "设计", "建筑", "结构", "施工", "材料", "荷载", "钢筋", "混凝土", "疏散", "消防", "安全", "防雷", "防水", "保温", "隔声", "采光", "通风"];
  const hasCodeKeyword = codeKeywords.some((k) => lower.includes(k));
  if (hasCodeKeyword && !hasExpertKeyword) return "code_query";

  // 模糊情况使用 DeepSeek 判断
  try {
    const response = await fetch(`${endpoint}/v1/chat/completions`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "Authorization": `Bearer ${apiKey}` },
      body: JSON.stringify({
        model,
        messages: [
          {
            role: "system",
            content:
              "你是一个意图分类器。用户的问题与建筑工程施工图审查相关。请判断用户意图：\n" +
              '- 如果用户询问规范条文、技术要求、设计标准等，返回 "code_query"\n' +
              '- 如果用户询问专家推荐、找人、谁擅长某个领域等，返回 "expert_match"\n' +
              '只返回 JSON：{"intent": "code_query"} 或 {"intent": "expert_match"}',
          },
          { role: "user", content: question },
        ],
        temperature: 0,
        max_tokens: 50,
      }),
    });
    if (!response.ok) return "code_query";
    const data = await response.json();
    try {
      const parsed = JSON.parse(data.choices?.[0]?.message?.content || "{}");
      if (parsed.intent === "expert_match") return "expert_match";
    } catch (e) {}
  } catch (e) {}

  return "code_query";
}
