const fs = require("fs");
const fpath = "D:\\codex-project\\shenxiaozu-demo\\src\\app\\api\\review\\generate\\route.ts";
let c = fs.readFileSync(fpath, "utf-8");

// Fix: remove duplicate line
c = c.replace(
  'const issuesRes = await fetch(issuesUrl, {const issuesRes = await fetch(issuesUrl, {',
  'const issuesRes = await fetch(issuesUrl, {'
);

fs.writeFileSync(fpath, c, "utf-8");
console.log("Fixed duplicate line");