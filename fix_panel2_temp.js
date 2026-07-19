const fs = require("fs");
const path = "D:/codex-project/shenxiaozu-demo/src/features/project-manage/ProjectManagePanel.tsx";
let c = fs.readFileSync(path, "utf8");

// Remove leftover comment lines
c = c.replace(/\/\/ Will be populated from API on mount\s*/g, "");

// Insert MOCK_PROJECTS before function getFL
var mockData = "\n\n" +
"const MOCK_PROJECTS: ProjectItem[] = [" +
'\n  { id:"p001", name:"\u57ce\u4e1c\u4e5d\u5e74\u5236\u516c\u7acb\u5b66\u6821\u6269\u5efa\u5de5\u7a0b", number:"SJ2024-001", buildingType:"\u6559\u80b2\u5efa\u7b51", buildingSubType:"\u5b66\u6821", createdAt:"2024-03-15" },' +
'\n  { id:"p002", name:"\u6ee8\u6c5f\u56fd\u9645\u793e\u533a\u4f4f\u5b85\u9879\u76ee", number:"SJ2024-002", buildingType:"\u4f4f\u5b85", buildingSubType:"\u4f4f\u5b85", createdAt:"2024-04-20" },' +
'\n  { id:"p003", name:"\u897f\u90e8\u65b0\u57ce\u5546\u4e1a\u7efc\u5408\u4f53", number:"SJ2024-003", buildingType:"\u5546\u4e1a\u5efa\u7b51", buildingSubType:"\u5546\u4e1a", createdAt:"2024-05-10" },' +
'\n  { id:"p004", name:"\u5e02\u7b2c\u4e8c\u4eba\u6c11\u533b\u9662\u8fc1\u5efa\u5de5\u7a0b", number:"SJ2024-004", buildingType:"\u533b\u7597\u5efa\u7b51", buildingSubType:"\u533b\u7597", createdAt:"2024-06-01" },' +
'\n  { id:"p005", name:"\u9ad8\u65b0\u533a\u79d1\u6280\u521b\u65b0\u56ed\u533a", number:"SJ2024-005", buildingType:"\u529e\u516c\u5efa\u7b51", buildingSubType:"\u529e\u516c", createdAt:"2024-06-28" },' +
'\n  { id:"p006", name:"\u57ce\u5317\u5b89\u7f6e\u623f\u9879\u76ee", number:"SJ2023-012", buildingType:"\u4f4f\u5b85", buildingSubType:"\u4f4f\u5b85", createdAt:"2023-11-05" },' +
'\n  { id:"p007", name:"\u7eff\u57ce\u00b7\u6842\u8bed\u5170\u5ead", number:"SJ2023-008", buildingType:"\u4f4f\u5b85", buildingSubType:"\u4f4f\u5b85", createdAt:"2023-08-12" },' +
'\n  { id:"p008", name:"\u56db\u5ddd\u4e94\u4e2d\u5b9e\u9a8c\u697c\u65b0\u5efa\u9879\u76ee", number:"SJ2023-015", buildingType:"\u6559\u80b2\u5efa\u7b51", buildingSubType:"\u5b66\u6821", createdAt:"2023-09-20" },' +
'\n  { id:"p009", name:"\u5357\u6e56\u751f\u6001\u57ce\u4f1a\u5c55\u4e2d\u5fc3", number:"SJ2024-006", buildingType:"\u516c\u5171\u5efa\u7b51", buildingSubType:"\u516c\u5171\u5efa\u7b51", createdAt:"2024-07-03" },' +
'\n  { id:"p010", name:"\u6210\u90fd\u4e09\u4e2d\u6559\u5b66\u697c\u6539\u9020\u5de5\u7a0b", number:"SJ2023-003", buildingType:"\u6559\u80b2\u5efa\u7b51", buildingSubType:"\u5b66\u6821", createdAt:"2023-04-18" },' +
'\n  { id:"p011", name:"\u57ce\u4e1c\u533a\u7269\u6d41\u4ed3\u50a8\u4e2d\u5fc3", number:"SJ2024-007", buildingType:"\u5de5\u4e1a\u5efa\u7b51", buildingSubType:"\u5de5\u4e1a", createdAt:"2024-02-14" },' +
'\n  { id:"p012", name:"\u9f99\u6cc9\u9a7f\u533a\u517b\u8001\u670d\u52a1\u4e2d\u5fc3", number:"SJ2024-008", buildingType:"\u517b\u8001\u5efa\u7b51", buildingSubType:"\u517b\u8001", createdAt:"2024-07-10" },' +
'\n  { id:"p013", name:"\u5730\u94c15\u53f7\u7ebf\u8f66\u8f86\u6bb5\u4e0a\u76d6\u9879\u76ee", number:"SJ2024-009", buildingType:"\u4ea4\u901a\u5efa\u7b51", buildingSubType:"\u4ea4\u901a", createdAt:"2024-01-20" },' +
'\n  { id:"p014", name:"\u57ce\u897f\u6c61\u6c34\u5904\u7406\u5382\u6539\u5efa", number:"SJ2023-018", buildingType:"\u5de5\u4e1a\u5efa\u7b51", buildingSubType:"\u5de5\u4e1a", createdAt:"2023-12-01" },' +
'\n  { id:"p015", name:"\u8700\u90fd\u4e07\u8fbe\u5e7f\u573a", number:"SJ2023-010", buildingType:"\u5546\u4e1a\u5efa\u7b51", buildingSubType:"\u5546\u4e1a", createdAt:"2023-06-15" },' +
'\n  { id:"p016", name:"\u6c6f\u6c5f\u751f\u6001\u4f4f\u5b85\u5c0f\u533a", number:"SJ2024-010", buildingType:"\u4f4f\u5b85", buildingSubType:"\u4f4f\u5b85", createdAt:"2024-05-08" },' +
'\n  { id:"p017", name:"\u56db\u5ddd\u5927\u5b66\u534e\u897f\u6821\u533a\u5b9e\u9a8c\u697c", number:"SJ2024-011", buildingType:"\u6559\u80b2\u5efa\u7b51", buildingSubType:"\u5b66\u6821", createdAt:"2024-07-15" },' +
"\n];\n";
c = c.replace("function getFL(", mockData + "\nfunction getFL(");

// Change projects state to use MOCK_PROJECTS as default
c = c.replace("const [projects, setProjects] = useState<ProjectItem[]>([]);", "const [projects, setProjects] = useState<ProjectItem[]>(MOCK_PROJECTS);");

// Change fetch to prepend real data before mock
c = c.replace(
  "if (d.success && Array.isArray(d.data)) {\n          const realProjects = d.data.map((p) => ({",
  "if (d.success && Array.isArray(d.data)) {\n          const realProjects = d.data.map((p) => ({"
);

// Find the setProjects call inside the fetch and change it
c = c.replace(
  '          }));\n          setProjects([...realProjects, ...MOCK_PROJECTS]);\n        }',
  '          }));\n          setProjects([...realProjects, ...MOCK_PROJECTS.filter(m => !realProjects.find(r => r.id === m.id))]);\n        }'
);

fs.writeFileSync(path, c, "utf8");
console.log("OK");
