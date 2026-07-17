const fs = require("fs");
const fpath = "D:\\codex-project\\shenxiaozu-demo\\src\\app\\api\\review\\generate\\route.ts";
let c = fs.readFileSync(fpath, "utf-8");
c = c.replace(
  'const { project_info, special_designs } = body;',
  'const { project_info, special_designs } = body;\n    console.log("[DEBUG] project_info:", JSON.stringify(project_info));\n    console.log("[DEBUG] special_designs:", JSON.stringify(special_designs));'
);
fs.writeFileSync(fpath, c, "utf-8");
console.log("done");