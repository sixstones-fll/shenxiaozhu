const fs = require("fs");
const fpath = "D:\\codex-project\\shenxiaozu-demo\\src\\app\\api\\review\\generate\\route.ts";
let c = fs.readFileSync(fpath, "utf-8");

// Replace the building type matching logic
// Add a helper function to extract building type keywords and try multiple matches
const oldCode2 = '    let issuesUrl = supabaseUrl + "/rest/v1/history_issues?select=issue_summary,building_type,issue_description,requirement&major=eq." + encodeURIComponent(major);\n    if (buildingType) {\n      issuesUrl += "&building_type=ilike." + encodeURIComponent("*" + buildingType + "*");\n    }';

const newCode2 = '    // 提取建筑类型关键词用于匹配\n    const buildingKeywords = extractBuildingKeywords(buildingType);\n    \n    let issuesUrl = supabaseUrl + "/rest/v1/history_issues?select=issue_summary,building_type,issue_description,requirement&major=eq." + encodeURIComponent(major);\n    if (buildingKeywords.length > 0) {\n      // 用OR条件匹配多个关键词\n      const orFilters = buildingKeywords.map(k => "building_type.ilike." + encodeURIComponent("*" + k + "*")).join(",");\n      issuesUrl += "&or=(" + encodeURIComponent(orFilters) + ")";\n    }';

c = c.replace(oldCode2, newCode2);

// Add the buildingKeywords helper function after countBySummary
const helperFunc = `
// 从建筑类型字符串中提取关键词用于匹配
function extractBuildingKeywords(buildingType: string): string[] {
  if (!buildingType) return [];
  const keywords: string[] = [];
  // 常见建筑类型关键词映射
  if (/学校|教育|小学|中学|幼儿园/.test(buildingType)) keywords.push("学校");
  if (/住宅|公寓|保障房|洋房/.test(buildingType)) keywords.push("住宅");
  if (/医院|康养|医疗/.test(buildingType)) keywords.push("医院");
  if (/商业|商场|购物/.test(buildingType)) keywords.push("商业");
  if (/办公|写字楼/.test(buildingType)) keywords.push("办公");
  if (/厂房|工业/.test(buildingType)) keywords.push("厂房");
  if (/车库|地下车库|停车/.test(buildingType)) keywords.push("地下车库");
  // 如果没有匹配到任何关键词，返回原始值
  if (keywords.length === 0) keywords.push(buildingType);
  return keywords;
}
`;

// Insert after countBySummary function closing brace
c = c.replace(
  "// -------------------- API 路由 --------------------",
  helperFunc + "\n\n// -------------------- API 路由 --------------------"
);

// Update the topIssues filter to show only those with frequency > 3
c = c.replace(
  "const topIssues = countBySummary(issues as HistoryIssue[]).map(item => {",
  "const topIssues = countBySummary(issues as HistoryIssue[]).filter(item => item.count > 3).map(item => {"
);

// Remove fallback logic since we now use keyword matching
c = c.replace(
  "    // 如果按建筑类型过滤没有结果，回退到只按专业查询\n    if (issues.length === 0 && buildingType) {",
  "    /*"
);
c = c.replace(
  "    }\n\n    // 按问题摘要统计频次取 top 3",
  "    */\n\n    // 按问题摘要统计频次取 top 3（仅显示出现次数大于3的）"
);

fs.writeFileSync(fpath, c, "utf-8");
console.log("Fixed: building type keyword matching + frequency > 3 filter");