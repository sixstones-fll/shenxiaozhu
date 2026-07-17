const fs = require("fs");
let c = fs.readFileSync("D:\\codex-project\\shenxiaozu-demo\\src\\app\\api\\review\\generate\\route.ts", "utf-8");

// Find the issues section and rebuild it
const markerStart = '// 4. 查询历史问题库（直接用 REST API）';
const markerEnd = 'const issuesRes = await fetch(issuesUrl, {';

const sIdx = c.indexOf(markerStart);
const eIdx = c.indexOf(markerEnd, sIdx);

const replacement = `    // 4. 查询历史问题库（直接用 REST API）
    const major = project_info?.审图专业 || "建筑专业";
    const buildingType = project_info?.建筑类型 || "";
    
    let issuesUrl = supabaseUrl + "/rest/v1/history_issues?select=issue_summary,building_type,issue_description,requirement&major=eq." + encodeURIComponent(major);
    if (buildingType) {
      issuesUrl += "&building_type=ilike." + encodeURIComponent("*" + buildingType + "*");
    }
    const issuesRes = await fetch(issuesUrl, {`;

c = c.substring(0, sIdx) + replacement + c.substring(eIdx);

fs.writeFileSync("D:\\codex-project\\shenxiaozu-demo\\src\\app\\api\\review\\generate\\route.ts", c, "utf-8");
console.log("Fixed successfully");