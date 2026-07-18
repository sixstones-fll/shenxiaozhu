const fs = require("fs");
const path = "D:/codex-project/shenxiaozu-demo/src/features/project-manage/ProjectManagePanel.tsx";
let c = fs.readFileSync(path, "utf8");

// Fix the comment on line 22-23
c = c.replace("// Will be populated from API on mountfunction", "// Will be populated from API on mount\nfunction");

// Remove MOCK reference line if present, replace with projects state
c = c.replace("let f = projects;", "  let f = projects;");

// Add state + useEffect after the existing state declarations
c = c.replace(
  "const [st, setSt] = useState<string | null>(null);",
  "const [st, setSt] = useState<string | null>(null);\n" +
  "  const [projects, setProjects] = useState<ProjectItem[]>([]);\n" +
  "  const [loading, setLoading] = useState(true);\n\n" +
  '  useEffect(() => {\n' +
  '    fetch("/api/projects")\n' +
  "      .then(r => r.json())\n" +
  "      .then(d => {\n" +
  "        if (d.success && Array.isArray(d.data)) {\n" +
  "          setProjects(d.data.map((p) => ({\n" +
  "            id: p.id,\n" +
  '            name: p.name || "",\n' +
  '            number: (p.project_info && p.project_info["项目编号"]) || "",\n' +
  '            buildingType: (p.project_info && p.project_info["建筑类型"]) || "",\n' +
  '            buildingSubType: (p.project_info && p.project_info["建筑类型"]) || "",\n' +
  "            createdAt: p.created_at ? p.created_at.substring(0, 10) : \"\",\n" +
  "          })));\n" +
  "        }\n" +
  "      })\n" +
  "      .catch(() => {})\n" +
  "      .finally(() => setLoading(false));\n" +
  "  }, []);"
);

fs.writeFileSync(path, c, "utf8");
console.log("OK");
