const fs = require("fs");
const fpath = "D:\\codex-project\\shenxiaozu-demo\\src\\app\\api\\review\\generate\\route.ts";
let c = fs.readFileSync(fpath, "utf-8");

// Simplify: don't filter by building_type at all, just get all issues for the major
// Then filter in JS by checking if building_type contains the keyword
const oldSection = "    // 提取建筑类型关键词用于匹配\n    const buildingKeywords = extractBuildingKeywords(buildingType);\n    \n    let issuesUrl = supabaseUrl + \"/rest/v1/history_issues?select=issue_summary,building_type,issue_description,requirement&major=eq.\" + encodeURIComponent(major);\n    if (buildingKeywords.length > 0) {\n      // 用OR条件匹配多个关键词\n      const orFilters = buildingKeywords.map(k => \"building_type.ilike.\" + encodeURIComponent(\"*\" + k + \"*\")).join(\",\");\n      issuesUrl += \"&or=(\" + encodeURIComponent(orFilters) + \")\";\n    }";

const newSection = "    let issuesUrl = supabaseUrl + \"/rest/v1/history_issues?select=issue_summary,building_type,issue_description,requirement&major=eq.\" + encodeURIComponent(major);";

c = c.replace(oldSection, newSection);

// Replace the filter with JS-side filtering
const oldFilter = "    // 按问题摘要统计频次取 top 3（仅显示出现次数大于3的）";
const newFilter = "    // 按问题摘要统计频次取 top 3（仅显示出现次数大于3的）\n    \n    // 在 JS 端按建筑类型关键词过滤\n    const buildingKeywords = extractBuildingKeywords(buildingType);\n    const filteredIssues = buildingKeywords.length > 0\n      ? issues.filter((i: any) => buildingKeywords.some((k: string) => i.building_type.includes(k)))\n      : issues;\n    ";

c = c.replace(oldFilter, newFilter);

// Update countBySummary call to use filteredIssues
c = c.replace(
  "const topIssues = countBySummary(issues as HistoryIssue[]).filter(item => item.count > 3).map(item => {",
  "const topIssues = countBySummary(filteredIssues as HistoryIssue[]).filter((item: any) => item.count > 3).map(item => {"
);

fs.writeFileSync(fpath, c, "utf-8");
console.log("Fixed: JS-side filtering");