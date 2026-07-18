const fs = require("fs");
const p = "D:/codex-project/shenxiaozu-demo/src/features/project-manage/ProjectManagePanel.tsx";
let c = fs.readFileSync(p, "utf8");

// 1. Add inferBuildingType function after BUILDING_TYPES
const typeFunc = `

function inferBuildingType(name: string): string {
  const rules: [RegExp, string][] = [
    [/学校|教育|实验楼|教学楼|校区|中学|小学|大学|学院/i, "教育建筑"],
    [/医院|医疗|病房|医技|门诊|护理/i, "医疗建筑"],
    [/住宅|小区|安置房|公寓|居住|家园|花园|社区/i, "住宅"],
    [/商业|综合体|商场|购物中心|广场|万达|商铺/i, "商业建筑"],
    [/办公|写字楼|商务|大厦|科创|科技|研发/i, "办公建筑"],
    [/工业|厂房|仓储|物流|加工|制造|产业园|污水处理/i, "工业建筑"],
    [/养老|福利院|敬老院|颐养/i, "养老建筑"],
    [/交通|地铁|车站|枢纽|机场|车辆段/i, "交通建筑"],
    [/会展|体育|文化|剧院|展览|博物馆|活动中心|会议/i, "公共建筑"],
  ];
  for (const [regex, type] of rules) {
    if (regex.test(name)) return type;
  }
  return "公共建筑";
}
`;

c = c.replace("function getFL", typeFunc + "\nfunction getFL");

// 2. Change realProjects useState to init from sessionStorage
c = c.replace(
  "const [realProjects, setRealProjects] = useState<ProjectItem[]>([]);",
  "const [realProjects, setRealProjects] = useState<ProjectItem[]>(() => { try { const c = sessionStorage.getItem(\"pm_real\"); return c ? JSON.parse(c) : []; } catch { return []; } });"
);

// 3. In fetch, add inferBuildingType + save to sessionStorage
c = c.replace(
  "setRealProjects(d.data.map((p) => ({\n            id: p.id,\n            name: p.name || \"\",\n            number: (p.project_info && p.project_info[\"项目编号\"]) || \"\",\n            buildingType: (p.project_info && p.project_info[\"建筑类型\"]) || \"\",\n            buildingSubType: (p.project_info && p.project_info[\"建筑类型\"]) || \"\",\n            createdAt: p.created_at ? p.created_at.substring(0, 10) : \"\",\n          })));",
  "const mapped = d.data.map((p) => ({\n            id: p.id,\n            name: p.name || \"\",\n            number: (p.project_info && p.project_info[\"项目编号\"]) || \"\",\n            buildingType: (p.project_info && p.project_info[\"建筑类型\"]) || inferBuildingType(p.name || \"\"),\n            buildingSubType: (p.project_info && p.project_info[\"建筑类型\"]) || inferBuildingType(p.name || \"\"),\n            createdAt: p.created_at ? p.created_at.substring(0, 10) : \"\",\n          }));\n          setRealProjects(mapped);\n          try { sessionStorage.setItem(\"pm_real\", JSON.stringify(mapped)); } catch {}"
);

fs.writeFileSync(p, c, "utf8");
console.log("OK");
