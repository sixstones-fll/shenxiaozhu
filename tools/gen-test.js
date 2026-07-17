const fs = require("fs");
const path = require("path");
const lines = [];
function add(l) { lines.push(l); }
add("const x = 1;");
add("// test");
const out = path.join("D:\\codex-project\\shenxiaozu-demo\\tools\\test.js");
fs.writeFileSync(out, lines.join("\n"), "utf-8");
console.log("done");