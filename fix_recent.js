const fs = require("fs");
const p = "D:/codex-project/shenxiaozu-demo/src/features/project-manage/ProjectManagePanel.tsx";
let c = fs.readFileSync(p, "utf8");

// Replace the dedup line to only take the most recent real project
c = c.replace(
  "let f = [...new Map([...realProjects, ...projects].map(i => [i.id, i])).values()];",
  "let f = [...(realProjects.length > 0 ? [realProjects.sort((a,b) => b.createdAt.localeCompare(a.createdAt))[0]] : []), ...projects];"
);

fs.writeFileSync(p, c, "utf8");
console.log("OK");
