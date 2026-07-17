import { ChatOpenAI } from "@langchain/openai";
import { ChatPromptTemplate } from "@langchain/core/prompts";
import { JsonOutputParser } from "@langchain/core/output_parsers";

export interface ExtractedProjectInfo {
  project_info: {
    项目名称: string | null;
    项目编号: string | null;
    建筑类型: string | null;
    高度分类: string | null;
    防火分类: string | null;
    结构形式: string | null;
    抗震设防烈度: string | null;
    审图专业: string | null;
  };
  special_designs: {
    人防: string | null;
    绿建: string | null;
    消防: string | null;
    无障碍: string | null;
    装配式: string | null;
    BIM: string | null;
    抗震支架: string | null;
    海绵城市: string | null;
  };
}

const EXTRACTION_PROMPT = ChatPromptTemplate.fromTemplate(`
你是一位建筑工程设计说明文档信息提取专家。请从以下建筑设计说明文本中提取指定字段，并以 JSON 格式返回。

需要提取的项目信息字段：
- 项目名称
- 项目编号
- 建筑类型（例如：住宅、商业、学校、医院、办公、工业厂房等）
- 高度分类（例如：一类高层、二类高层、多层、单层）
- 防火分类（例如：一类、二类、高层、多层等）
- 结构形式（例如：框架结构、剪力墙结构、框架-剪力墙结构、钢结构等）
- 抗震设防烈度（例如：6度、7度、8度、9度）
- 审图专业（默认值为"建筑专业"，如果文档中提到了具体审图专业则使用文档中的值，否则使用"建筑专业"）

需要提取的专项设计信息：
- 人防：描述人防设计等级和范围，若文档未提及返回 null
- 绿建：绿色建筑等级和相关措施，若文档未提及返回 null
- 消防：消防系统配置和防火措施，若文档未提及返回 null
- 无障碍：无障碍设计措施，若文档未提及返回 null
- 装配式：装配式建筑相关说明，若文档未提及返回 null
- BIM：BIM 应用说明，若文档未提及返回 null
- 抗震支架：机电抗震支吊架说明，若文档未提及返回 null
- 海绵城市：海绵城市措施说明，若文档未提及返回 null

请只输出 JSON，不要输出任何其他文字或解释。如果文档中没有提及某项，请用 null 表示。

建筑设计说明文本：
"""
{text}
"""

输出格式：
{{
  "project_info": {{
    "项目名称": "项目名称或 null",
    "项目编号": "项目编号或 null",
    "建筑类型": "建筑类型或 null",
    "高度分类": "高度分类或 null",
    "防火分类": "防火分类或 null",
    "结构形式": "结构形式或 null",
    "抗震设防烈度": "抗震设防烈度或 null",
    "审图专业": "审图专业或 null（未提取到时默认建筑专业）
  }},
  "special_designs": {{
    "人防": "描述或 null",
    "绿建": "描述或 null",
    "消防": "描述或 null",
    "无障碍": "描述或 null",
    "装配式": "描述或 null",
    "BIM": "描述或 null",
    "抗震支架": "描述或 null",
    "海绵城市": "描述或 null"
  }}
}}
`);


function resolveDeepSeekEndpoint(endpoint?: string): string {
  const base = endpoint || "https://api.deepseek.com";
  if (base.startsWith("https://api.deepseek.com") && !base.endsWith("/v1")) {
    return base.replace(/\/?$/, "") + "/v1";
  }
  return base;
}
const model = new ChatOpenAI({
  modelName: process.env.DEEPSEEK_MODEL || "deepseek-v4-flash",
  apiKey: process.env.DEEPSEEK_API_KEY,
  configuration: {
    baseURL: resolveDeepSeekEndpoint(process.env.DEEPSEEK_API_ENDPOINT),
  },
  temperature: 0.1,
  maxRetries: 2,
});

const parser = new JsonOutputParser<ExtractedProjectInfo>();


const PROJECT_NAME_PROMPT = ChatPromptTemplate.fromTemplate(`
你是一位建筑工程设计说明文档信息提取专家。请从以下建筑设计说明文本中仅提取"项目名称"，并以 JSON 格式返回。

要求：
- 仅输出项目全称，不要包含其他文字
- 如果文档中没有明确的项目名称，请返回 null

建筑设计说明文本：
"""
{text}
"""

输出格式：
{{"project_name": "项目名称或 null"}}
`);

const nameParser = new JsonOutputParser<{ project_name: string | null }>();

export async function extractProjectName(text: string): Promise<string | null> {
  const chain = PROJECT_NAME_PROMPT.pipe(model).pipe(nameParser);
  const result = await chain.invoke({ text });
  return result.project_name;
}

export async function extractProjectInfo(text: string): Promise<ExtractedProjectInfo> {  const chain = EXTRACTION_PROMPT.pipe(model).pipe(parser);
  return await chain.invoke({ text });
}
