"use client";
import UploadView from "./UploadView";
import { useState, useEffect, useRef } from "react";
import { Upload, BookOpen, Database } from "lucide-react";

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

  if (loading) return <div className="text-center text-gray-400 py-12 text-sm text-gray-500">加载中...</div>;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-base font-semibold text-gray-900">规范库</h3>
        <span className="text-xs text-gray-400">共 {data.length} 条记录</span>
      </div>
      <div className="border border-gray-200 rounded-lg overflow-x-auto max-h-[600px] overflow-y-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 sticky top-0">
            <tr><th className="px-3 py-2 text-left text-xs font-medium text-gray-500">编号</th><th className="px-3 py-2 text-left text-xs font-medium text-gray-500">规范名称</th><th className="px-3 py-2 text-left text-xs font-medium text-gray-500">分类</th></tr>
          </thead>
          <tbody>{data.slice(0, 100).map((r: any, i: number) => (
            <tr key={i} className="border-t border-gray-100">
              <td className="px-3 py-2 text-xs text-gray-500">{r.code_number || "-"}</td>
              <td className="px-3 py-2 text-sm text-gray-900">{r.code_name || "-"}</td>
              <td className="px-3 py-2 text-xs text-gray-500">{r.category || "-"}</td>
            </tr>
          ))}</tbody>
        </table>
      </div>
    </div>
  );
}

function IssuesView() {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const fetched = useRef(false);

  useEffect(() => {
    const cached = sessionStorage.getItem("kb_issues_cache");
    if (cached) {
      try {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed)) { setData(parsed); return; }
      } catch {}
    }
    setLoading(true);
    fetch("/api/kb-data?type=issues")
      .then(r => r.json())
      .then(d => {
        if (d.success) {
          setData(d.data || []);
          sessionStorage.setItem("kb_issues_cache", JSON.stringify(d.data || []));
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="text-center text-gray-400 py-12 text-sm text-gray-500">加载中...</div>;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-base font-semibold text-gray-900">历史问题库</h3>
        <span className="text-xs text-gray-400">共 {data.length} 条记录</span>
      </div>
      <div className="border border-gray-200 rounded-lg overflow-x-auto max-h-[600px] overflow-y-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 sticky top-0">
            <tr><th className="px-3 py-2 text-left text-xs font-medium text-gray-500">专业</th><th className="px-3 py-2 text-left text-xs font-medium text-gray-500">问题描述</th><th className="px-3 py-2 text-left text-xs font-medium text-gray-500">项目名称</th><th className="px-3 py-2 text-left text-xs font-medium text-gray-500">建筑类型</th></tr>
          </thead>
          <tbody>{data.slice(0, 100).map((r: any, i: number) => (
            <tr key={i} className="border-t border-gray-100">
              <td className="px-3 py-2 text-xs text-gray-500">{r.major || "-"}</td>
              <td className="px-3 py-2 text-sm text-gray-900 max-w-[300px] truncate">{r.issue_description || "-"}</td>
              <td className="px-3 py-2 text-xs text-gray-500">{r.project_name || "-"}</td>
              <td className="px-3 py-2 text-xs text-gray-500">{r.building_type || "-"}</td>
            </tr>
          ))}</tbody>
        </table>
      </div>
    </div>
  );
}