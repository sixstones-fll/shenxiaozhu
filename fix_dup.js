const fs = require("fs");
const path = "D:/codex-project/shenxiaozu-demo/src/features/project-manage/ProjectManagePanel.tsx";
let c = fs.readFileSync(path, "utf8");

// Replace projects + loading state
let old1 = "const [projects, setProjects] = useState<ProjectItem[]>(MOCK_PROJECTS);\n  const [loading, setLoading] = useState(true);";
let new1 = "const [projects, setProjects] = useState<ProjectItem[]>(MOCK_PROJECTS);\n  const [realProjects, setRealProjects] = useState<ProjectItem[]>([]);";
c = c.replace(old1, new1);

// Replace the useEffect body - remove .finally and setProjects -> setRealProjects
let old2 = ".then(d => {\n        if (d.success && Array.isArray(d.data)) {\n          const realProjects = d.data.map((p) => ({\n            id: p.id,\n            name: p.name || \"\",\n            number: (p.project_info && p.project_info[\"\u9879\u76ee\u7f16\u53f7\"]) || \"\",\n            buildingType: (p.project_info && p.project_info[\"\u5efa\u7b51\u7c7b\u578b\"]) || \"\",\n            buildingSubType: (p.project_info && p.project_info[\"\u5efa\u7b51\u7c7b\u578b\"]) || \"\",\n            createdAt: p.created_at ? p.created_at.substring(0, 10) : \"\",\n          }));\n          setProjects([...realProjects, ...MOCK_PROJECTS]);\n        }\n      })\n      .catch(() => {})\n      .finally(() => setLoading(false));\n  }, []);";

let new2 = ".then(d => {\n        if (d.success && Array.isArray(d.data)) {\n          setRealProjects(d.data.map((p) => ({\n            id: p.id,\n            name: p.name || \"\",\n            number: (p.project_info && p.project_info[\"\u9879\u76ee\u7f16\u53f7\"]) || \"\",\n            buildingType: (p.project_info && p.project_info[\"\u5efa\u7b51\u7c7b\u578b\"]) || \"\",\n            buildingSubType: (p.project_info && p.project_info[\"\u5efa\u7b51\u7c7b\u578b\"]) || \"\",\n            createdAt: p.created_at ? p.created_at.substring(0, 10) : \"\",\n          })));\n        }\n      })\n      .catch(() => {});\n  }, []);";

c = c.replace(old2, new2);

// Change let f = projects; to combine both
c = c.replace("let f = projects;", "let f = [...realProjects, ...projects];");

fs.writeFileSync(path, c, "utf8");
console.log("OK");
