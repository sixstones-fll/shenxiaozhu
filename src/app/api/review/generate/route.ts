import { NextRequest, NextResponse } from "next/server";

import { ChatOpenAI } from "@langchain/openai";
import { ChatPromptTemplate } from "@langchain/core/prompts";
import { JsonOutputParser } from "@langchain/core/output_parsers";
import { createClient } from "@supabase/supabase-js";

// -------------------- 类型定义 --------------------

interface Regulation {
  code_number: string;
  code_name: string;
  applicable_major: string;
  applicable_building_type: string | null;
  remark: string | null;
}

interface HistoryIssue {
  issue_summary: string;
  building_type: string;
  issue_description: string;
  requirement: string;
}

// -------------------- 辅助函数 --------------------

function buildProjectContext(projectInfo: any, specialDesigns: any): string {
  const parts: string[] = [];
  if (projectInfo) {
    const usefulFields: Record<string, string> = {
      "建筑类型": "建筑类型",
      "高度分类": "高度分类",
      "防火分类": "防火分类",
      "结构形式": "结构形式",
      "抗震设防烈度": "抗震设防烈度",
      "审图专业": "审图专业",
    };
    for (const [key, label] of Object.entries(usefulFields)) {
      const val = projectInfo[key];
      if (val && val !== "null" && val !== "未提取到") {
        parts.push(`${label}: ${val}`);
      }
    }
  }
  if (specialDesigns) {
    const involvedSpecials: string[] = [];
    for (const [key, val] of Object.entries(specialDesigns)) {
      if (val && val !== "null" && val !== "" && val !== "未涉及") {
        involvedSpecials.push(key);
      }
    }
    if (involvedSpecials.length > 0) {
      parts.push(`涉及专项设计: ${involvedSpecials.join("、")}`);
    }
  }
  return parts.join("\n");
}

function countBySummary(issues: HistoryIssue[]): { summary: string; count: number; samples: HistoryIssue[] }[] {
  const map = new Map<string, { count: number; samples: HistoryIssue[] }>();
  for (const issue of issues) {
    const key = issue.issue_summary;
    if (!map.has(key)) {
      map.set(key, { count: 0, samples: [] });
    }
    const entry = map.get(key)!;
    entry.count++;
    entry.samples.push(issue);
  }
  return Array.from(map.entries())
    .map(([summary, data]) => ({ summary, count: data.count, samples: data.samples }))
    .sort((a, b) => b.count - a.count)
    ;
}


// 从建筑类型字符串中提取关键词用于匹配
function extractBuildingKeywords(buildingType: string): string[] {
  if (!buildingType) return [];
  const keywords: string[] = [];
  // 常见建筑类型关键词映射（支持多层公共建筑（教育建筑）这类长描述）
  if (/学校|教育|小学|中学|幼儿园/.test(buildingType)) keywords.push("学校");
  if (/住宅|公寓|保障房|洋房|居住/.test(buildingType)) keywords.push("住宅");
  if (/医院|康养|医疗|护理/.test(buildingType)) keywords.push("医院");
  if (/商业|商场|购物|酒店|餐饮/.test(buildingType)) keywords.push("商业");
  if (/办公|写字楼/.test(buildingType)) keywords.push("办公");
  if (/厂房|工业|仓储|物流/.test(buildingType)) keywords.push("工业厂房");
  if (/车库|地下车库|停车/.test(buildingType)) keywords.push("地下车库");
  if (/体育|场馆|展览/.test(buildingType)) keywords.push("体育场馆");
  if (/学校|教育/.test(buildingType)) keywords.push("学校");
  // 如果没有匹配到任何关键词，返回"通用"
  if (keywords.length === 0) keywords.push("通用");
  return keywords;
}


// -------------------- API 路由 --------------------

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { project_info, special_designs } = body;

    // 1. 从环境变量获取 Supabase 配置
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

    // 2. 查询规范知识库（直接用 REST API 绕过 RLS）
    const regulationsRes = await fetch(`${supabaseUrl}/rest/v1/code_regulations?select=code_number,code_name,applicable_major,applicable_building_type,remark&order=id.asc`, {
      headers: {
        "apikey": serviceKey,
        "Authorization": `Bearer ${serviceKey}`,
      },
    });
    if (!regulationsRes.ok) {
      const errText = await regulationsRes.text();
      return NextResponse.json({ success: false, error: "查询规范库失败: " + errText }, { status: 500 });
    }
    const regulations = await regulationsRes.json();

    // 3. 用 DeepSeek 做语义匹配
    const projectContext = buildProjectContext(project_info, special_designs);
    const regulationList = (regulations as Regulation[]).map(
      (r) => `${r.code_number} ${r.code_name} [适用专业:${r.applicable_major}] [建筑类型:${r.applicable_building_type || "通用"}] [备注:${r.remark || ""}]`
    ).join("\n");

    const matchPrompt = ChatPromptTemplate.fromTemplate(`
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
`);

    const model = new ChatOpenAI({
      modelName: process.env.DEEPSEEK_MODEL || "deepseek-v4-flash",
      apiKey: process.env.DEEPSEEK_API_KEY,
      configuration: {
        baseURL: (process.env.DEEPSEEK_API_ENDPOINT || "https://api.deepseek.com").replace(/\/?$/, "") + "/v1",
      },
      temperature: 0.1,
      maxRetries: 2,
    });

    const parser = new JsonOutputParser();
    const chain = matchPrompt.pipe(model).pipe(parser);
    const matchedRegulations = await chain.invoke({
      project_context: projectContext,
      regulation_list: regulationList,
    });

        // 4. 查询历史问题库（直接用 REST API）
    const major = project_info?.审图专业 || "建筑专业";
    const buildingType = project_info?.建筑类型 || "";
    
    // 4. 查询历史问题库（直接用 REST API 绕过 RLS）
    const issuesUrl = supabaseUrl + "/rest/v1/history_issues?select=issue_summary,building_type,issue_description,requirement,project_name&major=eq." + encodeURIComponent(major);
    const issuesRes = await fetch(issuesUrl, {
      headers: {
        "apikey": serviceKey,
        "Authorization": `Bearer ${serviceKey}`,
      },
    });
    let issues = await issuesRes.json();
    if (!Array.isArray(issues)) issues = [];
    console.log("[DEBUG] issues count:", issues.length);

    /*
      const fallbackUrl = supabaseUrl + "/rest/v1/history_issues?select=issue_summary,building_type,issue_description,requirement,project_name&major=eq." + encodeURIComponent(major);
      const fallbackRes = await fetch(fallbackUrl, {
        headers: {
          "apikey": serviceKey,
          "Authorization": `Bearer ${serviceKey}`,
        },
      });
      if (fallbackRes.ok) {
        issues = await fallbackRes.json();
      }
    */

    // 按问题摘要统计频次取 top 3（仅显示出现次数大于3的）
    
    // 在 JS 端按建筑类型关键词过滤
    const buildingKeywords = extractBuildingKeywords(buildingType);
    const filteredIssues = buildingKeywords.length > 0
      ? issues.filter((i: any) => buildingKeywords.some((k: string) => i.building_type.includes(k)))
      : issues;
    
    const topIssues = countBySummary(filteredIssues as HistoryIssue[]).filter((item: any) => item.count >= 3).map(item => {
      // 随机选一条样本
      const sample = item.samples[Math.floor(Math.random() * item.samples.length)];
      return {
        issue_summary: item.summary,
        frequency: item.count,
        sample_description: sample.issue_description,
        sample_requirement: sample.requirement,
      };
    });

    // 5. 返回结果
    return NextResponse.json({
      success: true,
      data: {
        regulations: Array.isArray(matchedRegulations) ? matchedRegulations : [],
        top_issues: topIssues,
      },
    });

  } catch (error: any) {
    console.error("审图规划生成失败:", error);
    return NextResponse.json(
      { success: false, error: error.message || "服务器错误" },
      { status: 500 }
    );
  }
}




