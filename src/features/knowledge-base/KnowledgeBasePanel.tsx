"use client";
import UploadView from "./UploadView";
import { useState, useEffect, useRef } from "react";
import { Upload, BookOpen, Database, Search } from "lucide-react";

const STORAGE_KEY = "kb_panel_state";

interface PanelState {
  mainTab: string;
  wizardStep: number;
  dataType: string;
  dataFormat: string;
  segmentMode: string;
  segmentMaxLength: number;
  segmentOverlap: number;
  segmentDelimiter: string;
  segmentMinLength: number;
  segmentHeadingLevels: string[];
  fileName: string;
  parsedHeaders: string[];
  parsedPreview: string[][];
  uploadComplete: boolean;
}

export default function KnowledgeBasePanel() {
  const [state, setState] = useState<PanelState>(() => {
    try { const saved = sessionStorage.getItem(STORAGE_KEY); if (saved) { const parsed = JSON.parse(saved); if (parsed && parsed.mainTab) return parsed; } } catch {}
    return {
      mainTab: "upload", wizardStep: 1, dataType: "regulations",
      dataFormat: "文档格式", segmentMode: "auto",
      segmentMaxLength: 1000, segmentOverlap: 100,
      segmentDelimiter: "", segmentMinLength: 200,
      segmentHeadingLevels: ["h1", "h2"],
      fileName: "", parsedHeaders: [], parsedPreview: [], uploadComplete: false
    };
  });

  useEffect(() => {
    try { sessionStorage.setItem(STORAGE_KEY, JSON.stringify(state)); } catch {}
  }, [state]);

  const update = (partial: Partial<PanelState>) => setState(s => ({ ...s, ...partial }));

  const mainTabs = [
    { key: "upload", label: "上传知识", icon: Upload },
    { key: "regulations", label: "查看规范库", icon: BookOpen },
    { key: "issues", label: "查看问题库", icon: Database },
  ];

  return (
    <div className="h-full flex flex-col">
      <div className="shrink-0 border-b border-gray-200">
        <nav className="flex gap-1">
          {mainTabs.map(tab => (
            <button key={tab.key} onClick={() => update({ mainTab: tab.key })}
              className={"flex items-center gap-2 px-4 py-3 text-sm transition-colors border-b-2 " + (state.mainTab === tab.key ? "border-blue-600 text-blue-600 font-medium" : "border-transparent text-gray-500 hover:text-gray-700")}>
              <tab.icon className="w-4 h-4" />{tab.label}
            </button>
          ))}
        </nav>
      </div>
      <div className="flex-1 overflow-y-auto p-6">
        {state.mainTab === "upload" && <UploadView state={state} update={update} />}
        {state.mainTab === "regulations" && <RegulationsView />}
        {state.mainTab === "issues" && <IssuesView />}
      </div>
    </div>
  );
}


function RegulationsView() {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchText, setSearchText] = useState("");
  const [letterFilter, setLetterFilter] = useState("");
  const fetched = useRef(false);

  useEffect(() => {
    const cached = sessionStorage.getItem("kb_regulations_cache");
    if (cached) {
      try {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed)) { setData(parsed); return; }
      } catch {}
    }
    setLoading(true);
    fetch("/api/kb-data?type=regulations")
      .then(r => r.json())
      .then(d => {
        if (d.success) {
          setData(d.data || []);
          sessionStorage.setItem("kb_regulations_cache", JSON.stringify(d.data || []));
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const filtered = data.filter(r => {
    const name = (r.code_name || "").toLowerCase();
    const number = (r.code_number || "").toLowerCase();
    const q = searchText.toLowerCase();
    if (q && !name.includes(q) && !number.includes(q)) return false;
    if (letterFilter) {
      const firstChar = (r.code_number || "").charAt(0).toUpperCase();
      if (firstChar !== letterFilter) return false;
    }
    return true;
  });

  const letters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");

  if (loading) return <div className="text-center text-gray-400 py-12 text-sm">加载中...</div>;

  return (
    <div className="space-y-4">
      <div className="relative">
        <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          value={searchText}
          onChange={e => setSearchText(e.target.value)}
          placeholder="搜索规范名称或编号..."
          className="w-full pl-10 pr-4 py-2 text-sm border border-gray-200 rounded-lg outline-none focus:border-blue-400"
        />
      </div>
      <div className="flex flex-wrap gap-1">
        <button
          onClick={() => setLetterFilter("")}
          className={"px-2 py-1 text-xs rounded " + (!letterFilter ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200")}
        >全部</button>
        {letters.map(ch => (
          <button
            key={ch}
            onClick={() => setLetterFilter(letterFilter === ch ? "" : ch)}
            className={"w-7 h-7 text-xs rounded font-medium " + (letterFilter === ch ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200")}
          >{ch}</button>
        ))}
      </div>
      <div className="border border-gray-200 rounded-lg overflow-x-auto max-h-[500px] overflow-y-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 sticky top-0">
            <tr>
              <th className="px-3 py-2 text-left text-xs font-semibold text-gray-500 uppercase">编号</th>
              <th className="px-3 py-2 text-left text-xs font-semibold text-gray-500 uppercase">规范名称</th>
              <th className="px-3 py-2 text-left text-xs font-semibold text-gray-500 uppercase">分类</th>
              <th className="px-3 py-2 text-center text-xs font-semibold text-gray-500 uppercase" style={{width:80}}>操作</th>
            </tr>
          </thead>
          <tbody>{filtered.slice(0, 100).map((r: any, i: number) => (
            <tr key={i} className="border-t border-gray-100 hover:bg-gray-50">
              <td className="px-3 py-2 text-xs text-gray-500">{r.code_number || "-"}</td>
              <td className="px-3 py-2 text-sm text-gray-900">{r.code_name || "-"}</td>
              <td className="px-3 py-2 text-xs text-gray-500">{r.category || "-"}</td>
              <td className="px-3 py-2 text-center">
                <button
                  onClick={() => alert("规范编号：" + (r.code_number || "-") + "\n规范名称：" + (r.code_name || "-") + "\n分类：" + (r.category || "-") + (r.detail ? "\n详情：" + r.detail : ""))}
                  className="text-xs text-blue-600 hover:text-blue-700 hover:underline"
                >查看详情</button>
              </td>
            </tr>
          ))}</tbody>
        </table>
        {filtered.length === 0 && (
          <div className="text-center text-gray-400 py-8 text-sm">未找到匹配的规范</div>
        )}
      </div>
      <div className="text-xs text-gray-400">共 {filtered.length} 条（显示前 100 条）</div>
    </div>
  );
}

function IssuesView() {
  const [searchText, setSearchText] = useState("");
  const [letterFilter, setLetterFilter] = useState("");
  const [detailProject, setDetailProject] = useState<number | null>(null);

  const mockProjects = [
    { id: 1, major: "建筑", projectName: "某商业综合体项目", buildingType: "商业建筑", createdDate: "2025-06-15", issueCount: 8 },
    { id: 2, major: "结构", projectName: "某住宅小区项目", buildingType: "住宅", createdDate: "2025-07-20", issueCount: 5 },
    { id: 3, major: "给排水", projectName: "某医院扩建项目", buildingType: "医疗建筑", createdDate: "2025-08-10", issueCount: 12 },
    { id: 4, major: "暖通", projectName: "某学校新建项目", buildingType: "教育建筑", createdDate: "2025-09-05", issueCount: 6 },
    { id: 5, major: "电气", projectName: "某工业厂房项目", buildingType: "工业建筑", createdDate: "2025-10-18", issueCount: 9 },
    { id: 6, major: "建筑", projectName: "某五星级酒店项目", buildingType: "商业建筑", createdDate: "2025-11-22", issueCount: 7 },
  ];

  const mockDetails: Record<number, { description: string; regulation: string }[]> = {
    1: [
      { description: "商业综合体消防疏散宽度不足，首层疏散外门净宽小于1.4m", regulation: "建筑防火通用规范 GB 55037-2022 第7.1.4条" },
      { description: "无障碍电梯候梯厅深度不足1.5m", regulation: "无障碍设计规范 GB 50763-2012 第3.8.1条" },
      { description: "中庭防火分区面积超过规范限值", regulation: "建筑防火通用规范 GB 55037-2022 第4.2.1条" },
      { description: "地下车库疏散距离超过60m", regulation: "建筑防火通用规范 GB 55037-2022 第7.4.2条" },
      { description: "屋面设备基础未设置防水反坎", regulation: "屋面工程技术规范 GB 50345-2012 第4.5.3条" },
      { description: "楼梯间自然排烟窗面积不足", regulation: "建筑防排烟系统技术标准 GB 51251-2017 第3.2.1条" },
      { description: "建筑外墙保温材料防火等级不符", regulation: "建筑设计防火规范 GB 50016-2014 第6.7.4条" },
      { description: "无障碍坡道坡度大于1:12", regulation: "无障碍设计规范 GB 50763-2012 第3.4.2条" },
    ],
    2: [
      { description: "住宅楼板厚度不满足隔声要求", regulation: "民用建筑隔声设计规范 GB 50118-2010 第4.2.1条" },
      { description: "阳台栏杆高度低于1.1m", regulation: "住宅设计规范 GB 50096-2011 第6.1.2条" },
      { description: "厨房排烟道截面面积偏小", regulation: "住宅设计规范 GB 50096-2011 第6.5.3条" },
      { description: "地下室底板防水等级不足", regulation: "地下工程防水技术规范 GB 50108-2008 第3.2.1条" },
      { description: "卫生间等电位联结设计缺失", regulation: "建筑物防雷设计规范 GB 50057-2010 第6.3.3条" },
    ],
  };

  const filtered = mockProjects.filter(p => {
    const q = searchText.toLowerCase();
    if (q && !p.projectName.toLowerCase().includes(q) && !p.buildingType.toLowerCase().includes(q)) return false;
    if (letterFilter) {
      const firstChar = p.projectName.charAt(0);
      const upper = firstChar.toUpperCase();
      if (upper < "A" || upper > "Z") return true;
      if (upper !== letterFilter) return false;
    }
    return true;
  });

  const letters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");

  if (detailProject !== null) {
    const proj = mockProjects.find(p => p.id === detailProject);
    const issues = mockDetails[detailProject] || [];
    return (
      <div className="flex gap-6 h-full">
        <div className="flex-1 min-w-0 space-y-4">
          <div className="relative">
            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input type="text" value={searchText} onChange={e => setSearchText(e.target.value)} placeholder="搜索项目名称或建筑类型..." className="w-full pl-10 pr-4 py-2 text-sm border border-gray-200 rounded-lg outline-none focus:border-blue-400" />
          </div>
          <div className="flex flex-wrap gap-1">
            <button onClick={() => setLetterFilter("")} className={"px-2 py-1 text-xs rounded " + (!letterFilter ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200")}>全部</button>
            {letters.map(ch => (<button key={ch} onClick={() => setLetterFilter(letterFilter === ch ? "" : ch)} className={"w-7 h-7 text-xs rounded font-medium " + (letterFilter === ch ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200")}>{ch}</button>))}
          </div>
          <div className="border border-gray-200 rounded-lg overflow-x-auto max-h-[500px] overflow-y-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 sticky top-0">
                <tr><th className="px-3 py-2 text-left text-xs font-semibold text-gray-500 uppercase">专业</th><th className="px-3 py-2 text-left text-xs font-semibold text-gray-500 uppercase">项目名称</th><th className="px-3 py-2 text-left text-xs font-semibold text-gray-500 uppercase">建筑类型</th><th className="px-3 py-2 text-left text-xs font-semibold text-gray-500 uppercase">创建日期</th><th className="px-3 py-2 text-center text-xs font-semibold text-gray-500 uppercase">问题数量</th><th className="px-3 py-2 text-center text-xs font-semibold text-gray-500 uppercase">操作</th></tr>
              </thead>
              <tbody>{filtered.map(p => (
                <tr key={p.id} className="border-t border-gray-100 hover:bg-gray-50">
                  <td className="px-3 py-2 text-xs text-gray-500">{p.major}</td>
                  <td className="px-3 py-2 text-sm text-gray-900">{p.projectName}</td>
                  <td className="px-3 py-2 text-xs text-gray-500">{p.buildingType}</td>
                  <td className="px-3 py-2 text-xs text-gray-500">{p.createdDate}</td>
                  <td className="px-3 py-2 text-center text-sm font-medium text-gray-900">{p.issueCount}</td>
                  <td className="px-3 py-2 text-center"><button onClick={() => setDetailProject(p.id)} className="text-xs text-blue-600 hover:text-blue-700 hover:underline">查看问题详情</button></td>
                </tr>
              ))}</tbody>
            </table>
            {filtered.length === 0 && <div className="text-center text-gray-400 py-8 text-sm">未找到匹配的项目</div>}
          </div>
          <div className="text-xs text-gray-400">共 {filtered.length} 个项目</div>
        </div>
        <div className="w-96 shrink-0 border-l border-gray-200 pl-6 overflow-y-auto">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-gray-900">{proj?.projectName || ""} - 问题清单</h3>
            <button onClick={() => setDetailProject(null)} className="text-xs text-blue-600 hover:text-blue-700">关闭</button>
          </div>
          <div className="space-y-3">
            {issues.length === 0 ? (
              <p className="text-sm text-gray-400">暂无详细问题记录</p>
            ) : (
              issues.map((iss, i) => (
                <div key={i} className="p-3 bg-gray-50 rounded-lg border border-gray-100">
                  <p className="text-sm text-gray-900 mb-1">{i + 1}. {iss.description}</p>
                  <p className="text-xs text-blue-600">{iss.regulation}</p>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="relative">
        <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
        <input type="text" value={searchText} onChange={e => setSearchText(e.target.value)} placeholder="搜索项目名称或建筑类型..." className="w-full pl-10 pr-4 py-2 text-sm border border-gray-200 rounded-lg outline-none focus:border-blue-400" />
      </div>
      <div className="flex flex-wrap gap-1">
        <button onClick={() => setLetterFilter("")} className={"px-2 py-1 text-xs rounded " + (!letterFilter ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200")}>全部</button>
        {letters.map(ch => (<button key={ch} onClick={() => setLetterFilter(letterFilter === ch ? "" : ch)} className={"w-7 h-7 text-xs rounded font-medium " + (letterFilter === ch ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200")}>{ch}</button>))}
      </div>
      <div className="border border-gray-200 rounded-lg overflow-x-auto max-h-[600px] overflow-y-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 sticky top-0">
            <tr><th className="px-3 py-2 text-left text-xs font-semibold text-gray-500 uppercase">专业</th><th className="px-3 py-2 text-left text-xs font-semibold text-gray-500 uppercase">项目名称</th><th className="px-3 py-2 text-left text-xs font-semibold text-gray-500 uppercase">建筑类型</th><th className="px-3 py-2 text-left text-xs font-semibold text-gray-500 uppercase">创建日期</th><th className="px-3 py-2 text-center text-xs font-semibold text-gray-500 uppercase">问题数量</th><th className="px-3 py-2 text-center text-xs font-semibold text-gray-500 uppercase">操作</th></tr>
          </thead>
          <tbody>{filtered.map(p => (
            <tr key={p.id} className="border-t border-gray-100 hover:bg-gray-50">
              <td className="px-3 py-2 text-xs text-gray-500">{p.major}</td>
              <td className="px-3 py-2 text-sm text-gray-900">{p.projectName}</td>
              <td className="px-3 py-2 text-xs text-gray-500">{p.buildingType}</td>
              <td className="px-3 py-2 text-xs text-gray-500">{p.createdDate}</td>
              <td className="px-3 py-2 text-center text-sm font-medium text-gray-900">{p.issueCount}</td>
              <td className="px-3 py-2 text-center"><button onClick={() => setDetailProject(p.id)} className="text-xs text-blue-600 hover:text-blue-700 hover:underline">查看问题详情</button></td>
            </tr>
          ))}</tbody>
        </table>
        {filtered.length === 0 && <div className="text-center text-gray-400 py-8 text-sm">未找到匹配的项目</div>}
      </div>
      <div className="text-xs text-gray-400">共 {filtered.length} 个项目</div>
    </div>
  );
}
