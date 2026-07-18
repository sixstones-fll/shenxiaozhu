"use client";
import { useState, useEffect } from "react";
import { Search, ArrowRight, Trash2 } from "lucide-react";
import Link from "next/link";

interface ProjectItem {
  id: string;
  name: string;
  number: string;
  buildingType: string;
  buildingSubType: string;
  createdAt: string;
}

const ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");

const BUILDING_TYPES = [
  "工业建筑","教育建筑","住宅","医疗建筑","交通建筑",
  "商业建筑","养老建筑","办公建筑","公共建筑",
];




const MOCK_PROJECTS: ProjectItem[] = [
  { id:"p001", name:"城东九年制公立学校扩建工程", number:"SJ2024-001", buildingType:"教育建筑", buildingSubType:"学校", createdAt:"2024-03-15" },
  { id:"p002", name:"滨江国际社区住宅项目", number:"SJ2024-002", buildingType:"住宅", buildingSubType:"住宅", createdAt:"2024-04-20" },
  { id:"p003", name:"西部新城商业综合体", number:"SJ2024-003", buildingType:"商业建筑", buildingSubType:"商业", createdAt:"2024-05-10" },
  { id:"p004", name:"市第二人民医院迁建工程", number:"SJ2024-004", buildingType:"医疗建筑", buildingSubType:"医疗", createdAt:"2024-06-01" },
  { id:"p005", name:"高新区科技创新园区", number:"SJ2024-005", buildingType:"办公建筑", buildingSubType:"办公", createdAt:"2024-06-28" },
  { id:"p006", name:"城北安置房项目", number:"SJ2023-012", buildingType:"住宅", buildingSubType:"住宅", createdAt:"2023-11-05" },
  { id:"p007", name:"绿城·桂语兰庭", number:"SJ2023-008", buildingType:"住宅", buildingSubType:"住宅", createdAt:"2023-08-12" },
  { id:"p008", name:"四川五中实验楼新建项目", number:"SJ2023-015", buildingType:"教育建筑", buildingSubType:"学校", createdAt:"2023-09-20" },
  { id:"p009", name:"南湖生态城会展中心", number:"SJ2024-006", buildingType:"公共建筑", buildingSubType:"公共建筑", createdAt:"2024-07-03" },
  { id:"p010", name:"成都三中教学楼改造工程", number:"SJ2023-003", buildingType:"教育建筑", buildingSubType:"学校", createdAt:"2023-04-18" },
  { id:"p011", name:"城东区物流仓储中心", number:"SJ2024-007", buildingType:"工业建筑", buildingSubType:"工业", createdAt:"2024-02-14" },
  { id:"p012", name:"龙泉驿区养老服务中心", number:"SJ2024-008", buildingType:"养老建筑", buildingSubType:"养老", createdAt:"2024-07-10" },
  { id:"p013", name:"地铁5号线车辆段上盖项目", number:"SJ2024-009", buildingType:"交通建筑", buildingSubType:"交通", createdAt:"2024-01-20" },
  { id:"p014", name:"城西污水处理厂改建", number:"SJ2023-018", buildingType:"工业建筑", buildingSubType:"工业", createdAt:"2023-12-01" },
  { id:"p015", name:"蜀都万达广场", number:"SJ2023-010", buildingType:"商业建筑", buildingSubType:"商业", createdAt:"2023-06-15" },
  { id:"p016", name:"汯江生态住宅小区", number:"SJ2024-010", buildingType:"住宅", buildingSubType:"住宅", createdAt:"2024-05-08" },
  { id:"p017", name:"四川大学华西校区实验楼", number:"SJ2024-011", buildingType:"教育建筑", buildingSubType:"学校", createdAt:"2024-07-15" },
];

function getFL(n: string) {
  const c = n.charCodeAt(0);
  const m: Record<string, string> = {"城":"C","滨":"B","西":"X","市":"S","高":"G","绿":"L","四":"S","南":"N","成":"C","龙":"L","地":"D","蜀":"S","沱":"T"};
  if (c >= 0x4e00) return m[n[0]] || n[0];
  return n[0].toUpperCase();
}

export default function ProjectManagePanel() {
  const [sq, setSq] = useState("");
  const [sl, setSl] = useState<string | null>(null);
  const [st, setSt] = useState<string | null>(null);
  const [projects, setProjects] = useState<ProjectItem[]>(MOCK_PROJECTS);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/projects")
      .then(r => r.json())
      .then(d => {
        if (d.success && Array.isArray(d.data)) {
          const realProjects = d.data.map((p) => ({
            id: p.id,
            name: p.name || "",
            number: (p.project_info && p.project_info["项目编号"]) || "",
            buildingType: (p.project_info && p.project_info["建筑类型"]) || "",
            buildingSubType: (p.project_info && p.project_info["建筑类型"]) || "",
            createdAt: p.created_at ? p.created_at.substring(0, 10) : "",
          }));
          setProjects([...realProjects, ...MOCK_PROJECTS]);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);
    let f = projects;
  if (sq.trim()) { const q = sq.trim().toLowerCase(); f = f.filter(p => p.name.toLowerCase().includes(q) || p.number.toLowerCase().includes(q)); }
  if (sl) f = f.filter(p => getFL(p.name) === sl);
  if (st) f = f.filter(p => p.buildingType === st);

  return (
    <div className="h-full flex flex-col">
      <div className="shrink-0 px-8 pt-6 pb-3">
        
        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input type="text" placeholder="搜索项目名称或编号..." value={sq} onChange={e => setSq(e.target.value)}
            className="w-full pl-10 pr-3 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500" />
        </div>
        <div className="flex items-center gap-0.5 mb-4 overflow-x-auto">
          <button onClick={() => setSl(null)} className={`px-2.5 py-1 text-xs rounded-md shrink-0 ${sl === null ? "bg-blue-600 text-white" : "text-gray-500 hover:bg-gray-100"}`}>全部</button>
          {ALPHABET.map(l => <button key={l} onClick={() => setSl(sl === l ? null : l)} className={`w-7 h-7 text-xs rounded-md shrink-0 ${sl === l ? "bg-blue-600 text-white" : "text-gray-500 hover:bg-gray-100"}`}>{l}</button>)}
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <button onClick={() => setSt(null)} className={`px-3 py-1.5 text-xs rounded-lg border ${st === null ? "bg-blue-600 text-white border-blue-600" : "border-gray-200 text-gray-600 hover:bg-gray-50"}`}>全部类型</button>
          {BUILDING_TYPES.map(t => <button key={t} onClick={() => setSt(st === t ? null : t)} className={`px-3 py-1.5 text-xs rounded-lg border ${st === t ? "bg-blue-600 text-white border-blue-600" : "border-gray-200 text-gray-600 hover:bg-gray-50"}`}>{t}</button>)}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-8">
        <table className="w-full table-fixed border-collapse">
          <thead className="sticky top-0 bg-white z-10">
            <tr className="text-xs text-gray-400 border-b border-gray-100">
              <th className="w-[38%] py-2 pl-4 font-semibold text-left">项目名称</th>
              <th className="w-[22%] py-2 font-semibold text-left">建筑类型</th>
              <th className="w-[22%] py-2 font-semibold text-left">创建时间</th>
              <th className="w-[18%] py-2 font-semibold text-left">操作</th>
            </tr>
          </thead>
          <tbody>
            {f.length === 0 ? (
              <tr><td colSpan={4} className="text-center text-gray-400 py-16 text-sm">暂无项目，请先在"新建项目"中创建</td></tr>
            ) : (
              f.map(p => (
                <tr key={p.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                  <td className="py-3 pl-4">
                    <span className="text-sm font-medium text-gray-900 truncate block max-w-full">{p.name}</span>
                  </td>
                  <td className="py-3">
                    <span className="text-xs text-gray-400">{p.buildingType}</span>
                  </td>
                  <td className="py-3">
                    <span className="text-xs text-gray-400">{p.createdAt}</span>
                  </td>
                  <td className="py-3">
                    <Link href={`/projects?id=${p.id}&tab=review`}
                      className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-blue-600 bg-blue-50 rounded-md hover:bg-blue-100 transition-colors">
                      进入详情 <ArrowRight className="w-3 h-3" />
                    </Link>
                    <button onClick={() => { if(confirm(`确定删除"${p.name}"吗？`)) {} }}
                      className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-md transition-colors ml-1">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
