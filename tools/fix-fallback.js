const fs = require("fs");
const fpath = "D:\\codex-project\\shenxiaozu-demo\\src\\app\\api\\review\\generate\\route.ts";
let c = fs.readFileSync(fpath, "utf-8");

// Replace the issues query section
const oldCode = '    const issuesRes = await fetch(issuesUrl, {\n      headers: {\n        "apikey": serviceKey,\n        "Authorization": `Bearer ${serviceKey}`,\n      },\n    });\n    if (!issuesRes.ok) {\n      const errText = await issuesRes.text();\n      return NextResponse.json({ success: false, error: "查询历史问题失败: " + errText }, { status: 500 });\n    }\n    const issues = await issuesRes.json();\n\n    // 按问题摘要统计频次取 top 3';

const newCode = '    const issuesRes = await fetch(issuesUrl, {\n      headers: {\n        "apikey": serviceKey,\n        "Authorization": `Bearer ${serviceKey}`,\n      },\n    });\n    let issues = await issuesRes.json();\n\n    // 如果按建筑类型过滤没有结果，回退到只按专业查询\n    if (issues.length === 0 && buildingType) {\n      const fallbackUrl = supabaseUrl + "/rest/v1/history_issues?select=issue_summary,building_type,issue_description,requirement&major=eq." + encodeURIComponent(major);\n      const fallbackRes = await fetch(fallbackUrl, {\n        headers: {\n          "apikey": serviceKey,\n          "Authorization": `Bearer ${serviceKey}`,\n        },\n      });\n      if (fallbackRes.ok) {\n        issues = await fallbackRes.json();\n      }\n    }\n\n    // 按问题摘要统计频次取 top 3';

c = c.replace(oldCode, newCode);

// Remove the debug logs
c = c.replace(
  "\n    console.log(\"[DEBUG] project_info:\", JSON.stringify(project_info));\n    console.log(\"[DEBUG] special_designs:\", JSON.stringify(special_designs));",
  ""
);

fs.writeFileSync(fpath, c, "utf-8");
console.log("Fixed: fallback when no building type match");