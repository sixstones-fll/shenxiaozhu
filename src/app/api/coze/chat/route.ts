// /api/coze/chat - 统一对话 API（意图识别 + 路由）
import { NextRequest, NextResponse } from 'next/server';

export const maxDuration = 300;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { question, expertOnly } = body;

    if (!question || typeof question !== 'string' || question.trim().length === 0) {
      return NextResponse.json({ success: false, error: '请输入问题' }, { status: 400 });
    }

    const trimmed = question.trim();

    if (expertOnly === true) {
      const result = await routeToCodeQuery(trimmed);
      return NextResponse.json(result);
    }

    const intent = identifyIntentFromKeywords(trimmed);

    if (intent === 'expert_match') {
      const result = await routeToExpertMatch(trimmed);
      return NextResponse.json(result);
    } else {
      const result = await routeToCodeQuery(trimmed);
      return NextResponse.json(result);
    }
  } catch (error: any) {
    console.error('Chat API error:', error);
    return NextResponse.json({ success: false, error: '服务暂不可用，请稍后重试' }, { status: 500 });
  }
}

function identifyIntentFromKeywords(question: string): 'code_query' | 'expert_match' {
  const expertKeywords = ['专家', '推荐', '找谁', '问谁', '哪位', '哪个', '擅长', '匹配', '谁负责', '找哪个', '联系人', '找哪位', '推荐问', '哪个专家', '帮我找', '介绍', '负责人', '联系方式', '联系'];
  const lower = question;
  const hasExpertKeyword = expertKeywords.some((k) => lower.includes(k));
  if (hasExpertKeyword) return 'expert_match';

  const codeKeywords = ['规范', '条文', '规定', '要求', '标准', '防火', '抗震', '条例', 'GB', '编号', '多少米', '多少度', '多高', '面积', '栏杆', '防护', '高度', '距离', '间距', '宽度', '厚度', '等级', '设计', '建筑', '结构', '施工', '材料', '荷载', '钢筋', '混凝土', '疏散', '消防', '安全', '防雷', '防水', '保温', '隔声', '采光', '通风'];
  const hasCodeKeyword = codeKeywords.some((k) => lower.includes(k));
  if (hasCodeKeyword) return 'code_query';

  return 'code_query';
}

async function routeToExpertMatch(question: string) {
  try {
    const response = await fetch('http://localhost:3008/api/expert-match', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ question }),
    });
    const data = await response.json();
    if (data.success && data.data?.output) {
      return {
        success: true,
        type: 'expert_match',
        data: data.data.output,
        askFollowUp: data.askFollowUp,
        detail: data.detail || null,
      };
    }
    return {
      success: true,
      type: 'expert_match',
      data: data.data?.output || '抱歉，暂时无法推荐专家，请稍后重试。',
      askFollowUp: false,
      detail: null,
    };
  } catch (e: any) {
    console.error('Expert match route error:', e);
    return { success: true, type: 'expert_match', data: '服务暂不可用，请稍后重试', askFollowUp: false, detail: null };
  }
}

async function routeToCodeQuery(question: string) {
  const workflowId = process.env.COZE_WORKFLOW_CODE_QUERY_ID;
  if (!workflowId) {
    return { success: true, type: 'code_query', data: '规范查询服务未配置', detail: null };
  }
  let rawOutput = '';
  // 先尝试 Coze 工作流
  try {
    const { runWorkflow } = await import('@/lib/coze');
    const result = await runWorkflow(workflowId, { input: question });
    if (result.success && result.data && result.data.code === 0) {
      const rawData = result.data;
      if (rawData.data) {
        if (typeof rawData.data === 'string') {
          try { const parsed = JSON.parse(rawData.data); rawOutput = parsed.output || parsed.content || rawData.data; }
          catch { rawOutput = rawData.data; }
        } else if (typeof rawData.data === 'object') {
          rawOutput = rawData.data.output || rawData.data.content || JSON.stringify(rawData.data);
        }
      }
      if (!rawOutput) rawOutput = rawData.output || rawData.msg || '';
    }
  } catch (e: any) {
    console.error('Coze workflow error:', e);
  }
  // 降级：DeepSeek
  if (!rawOutput) {
    try {
      const ep = process.env.DEEPSEEK_API_ENDPOINT || 'https://api.deepseek.com';
      const key = process.env.DEEPSEEK_API_KEY || '';
      const model = process.env.DEEPSEEK_MODEL || 'deepseek-v4-flash';
      const response = await fetch(ep + '/v1/chat/completions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + key },
        body: JSON.stringify({
          model,
          messages: [{ role: 'system', content: '你是一个建筑工程施工图审查规范查询助手。请根据用户问题，提供相关的国家规范、标准要求，并给出具体的条文编号和设计要求。回答要专业、准确、简洁。' }, { role: 'user', content: question }],
          temperature: 0.1,
          max_tokens: 2000,
        }),
      });
      const data = await response.json();
      rawOutput = data.choices?.[0]?.message?.content || '查询无结果';
    } catch (e: any) {
      console.error('DeepSeek fallback error:', e);
      return { success: true, type: 'code_query', data: '服务暂不可用，请稍后重试', detail: null };
    }
  }
  // 解析结构化规范数据
  const detail = await parseCodeRules(rawOutput);
  return { success: true, type: 'code_query', data: rawOutput, detail: detail };
}

async function parseCodeRules(text: string) {
  try {
    const ep = process.env.DEEPSEEK_API_ENDPOINT || 'https://api.deepseek.com';
    const key = process.env.DEEPSEEK_API_KEY || '';
    const model = process.env.DEEPSEEK_MODEL || 'deepseek-v4-flash';
    const response = await fetch(ep + '/v1/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + key },
      body: JSON.stringify({
        model,
        messages: [{
          role: 'system',
          content: '从以下规范回答文本中提取每条规范的结构化信息。返回JSON数组，每项包含：codeName（规范名称）、codeId（条文编号）、requirement（核心要求，20字以内）、detail（详细说明）、tips（要点解读：说明该规范在实际设计中容易踩坑的点，30字以内）。如果没有多条规范，就提取一条。只返回JSON数组，不要其他内容。格式：[{"codeName":"...","codeId":"...","requirement":"...","detail":"...","tips":"..."}]'
        }, { role: 'user', content: text }],
        temperature: 0,
        max_tokens: 2000,
      }),
    });
    if (!response.ok) return null;
    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || '[]';
    console.log('[PARSE] code rules raw:', content.slice(0, 200));
    const parsed = JSON.parse(content);
    if (Array.isArray(parsed) && parsed.length > 0) {
      return { type: 'code_query', rules: parsed };
    }
    return null;
  } catch (e: any) {
    console.error('[PARSE] code rules error:', e);
    return null;
  }
}
