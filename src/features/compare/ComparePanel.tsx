"use client";

import { useState, useRef } from "react";
import { Upload, FileText, Download, Eye, X } from "lucide-react";

interface CompareDetail {
  id: string;
  description: string;
  drawingNo: string;
  drawingName: string;
  violation: string;
  severity: string;
  status: string;
}

interface CompareResult {
  summary: { resolved: number; new: number; pending: number };
  conclusion: string;
  details: CompareDetail[];
  raw?: string;
}

export default function ComparePanel({ projectId }: { projectId: string }) {
  const storageKey = "compare_result_" + projectId;
  const [oldFile, setOldFile] = useState<File | null>(null);
  const [newFile, setNewFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<CompareResult | null>(() => {
    try { const s = sessionStorage.getItem(storageKey); return s ? JSON.parse(s) : null; } catch { return null; }
  });
  const [sidePanel, setSidePanel] = useState<{ type: string; data: any } | null>(null);
  const oldInputRef = useRef<HTMLInputElement>(null);
  const newInputRef = useRef<HTMLInputElement>(null);

  const handleCompare = async () => {
    if (!oldFile || !newFile) return;
    setLoading(true);
    try {
      const formData = new FormData();
      formData.append("oldReport", oldFile);
      formData.append("newReport", newFile);
      const res = await fetch("/api/compare", { method: "POST", body: formData });
      const json = await res.json();
      if (json.success && json.data) {
        setResult(json.data);
        try { sessionStorage.setItem(storageKey, JSON.stringify(json.data)); } catch {}
      }
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  const statusColors: Record<string, string> = {
    "已整改": "bg-green-50 text-green-700 border-green-200",
    "新增": "bg-blue-50 text-blue-700 border-blue-200",
    "待整改": "bg-red-50 text-red-700 border-red-200",
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto px-6 pt-4 pb-4">
        <div className="grid grid-cols-2 gap-6 mb-6">
          <div className="border border-gray-200 rounded-xl p-6">
            <h3 className="text-sm font-semibold text-gray-800 mb-3">旧版报告</h3>
            <div
              className="border-2 border-dashed border-gray-200 rounded-lg p-8 text-center hover:border-blue-300 transition-colors cursor-pointer"
              onClick={() => oldInputRef.current?.click()}
            >
              <input
                ref={oldInputRef}
                type="file"
                accept=".docx,.txt,.csv"
                className="hidden"
                onChange={(e) => { const f = e.target.files?.[0]; if (f) setOldFile(f); }}
              />
              {oldFile ? (
                <div className="flex items-center justify-center gap-2 text-blue-600">
                  <FileText className="w-5 h-5" />
                  <span className="text-sm font-medium">{oldFile.name}</span>
                </div>
              ) : (
                <div>
                  <Upload className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                  <p className="text-sm text-gray-400">点击上传旧版报告</p>
                </div>
              )}
            </div>
          </div>
          <div className="border border-gray-200 rounded-xl p-6">
            <h3 className="text-sm font-semibold text-gray-800 mb-3">新版报告</h3>
            <div
              className="border-2 border-dashed border-gray-200 rounded-lg p-8 text-center hover:border-blue-300 transition-colors cursor-pointer"
              onClick={() => newInputRef.current?.click()}
            >
              <input
                ref={newInputRef}
                type="file"
                accept=".docx,.txt,.csv"
                className="hidden"
                onChange={(e) => { const f = e.target.files?.[0]; if (f) setNewFile(f); }}
              />
              {newFile ? (
                <div className="flex items-center justify-center gap-2 text-blue-600">
                  <FileText className="w-5 h-5" />
                  <span className="text-sm font-medium">{newFile.name}</span>
                </div>
              ) : (
                <div>
                  <Upload className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                  <p className="text-sm text-gray-400">点击上传新版报告</p>
                </div>
              )}
            </div>
          </div>
        </div>
        <button
          onClick={handleCompare}
          disabled={!oldFile || !newFile || loading}
          className="w-full py-3 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed mb-6"
        >
          {loading ? "正在对比..." : "生成报告对比"}
        </button>
        {result && (
          <div className="space-y-6">
            <div className="flex gap-4">
              <div className="flex-1 bg-green-50 border border-green-200 rounded-xl p-4 text-center">
                <p className="text-xl font-bold text-green-700">{result.summary.resolved}</p>
                <p className="text-xs text-green-600 mt-1">已整改</p>
              </div>
              <div className="flex-1 bg-blue-50 border border-blue-200 rounded-xl p-4 text-center">
                <p className="text-xl font-bold text-blue-700">{result.summary.new}</p>
                <p className="text-xs text-blue-600 mt-1">新增</p>
              </div>
              <div className="flex-1 bg-red-50 border border-red-200 rounded-xl p-4 text-center">
                <p className="text-xl font-bold text-red-700">{result.summary.pending}</p>
                <p className="text-xs text-red-600 mt-1">待整改</p>
              </div>
            </div>
            <div className="bg-gray-50 border border-gray-200 rounded-xl p-4">
              <p className="text-xs font-medium text-gray-500 mb-1">对比结论</p>
              <p className="text-sm text-gray-800">{result.conclusion}</p>
            </div>
            {result.details.length > 0 && (
              <div className="border border-gray-200 rounded-xl overflow-hidden">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-200">
                      <th className="px-3 py-3 text-xs font-medium text-gray-500 text-left">序号</th>
                      <th className="px-3 py-3 text-xs font-medium text-gray-500 text-left">问题描述</th>
                      <th className="px-3 py-3 text-xs font-medium text-gray-500 text-left">图号</th>
                      <th className="px-3 py-3 text-xs font-medium text-gray-500 text-left">违反条文</th>
                      <th className="px-3 py-3 text-xs font-medium text-gray-500 text-center">状态</th>
                      <th className="px-3 py-3 text-xs font-medium text-gray-500 text-center">操作</th>
                    </tr>
                  </thead>
                  <tbody>
                    {result.details.map((d, i) => (
                      <tr key={i} className="border-b border-gray-100 hover:bg-gray-50">
                        <td className="px-3 py-3 text-gray-800">{d.id || i + 1}</td>
                        <td className="px-3 py-3 text-gray-800">{d.description}</td>
                        <td className="px-3 py-3 text-gray-500">{d.drawingNo}</td>
                        <td className="px-3 py-3 text-gray-600 max-w-[200px] truncate">{d.violation}</td>
                        <td className="px-3 py-3 text-center">
                          <span className={`text-xs px-2 py-1 rounded-full border ${statusColors[d.status] || ""}`}>{d.status}</span>
                        </td>
                        <td className="px-3 py-3 text-center">
                          <button
                            onClick={() => setSidePanel({ type: "detail", data: d })}
                            className="text-blue-600 hover:text-blue-700 text-xs font-medium flex items-center gap-1 mx-auto"
                          >
                            <Eye className="w-3.5 h-3.5" />查看
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            <button
              onClick={() => {
                const csv = [
                  ["序号","问题描述","图号","图名","违反条文","严重级","状态"].join(","),
                  ...result.details.map((d,i) =>
                    [d.id||i+1,d.description,d.drawingNo,d.drawingName,d.violation,d.severity,d.status]
                      .map(v => "\""+(v||"").toString().replace(/\"/g,"\"\"")+"\"").join(",")
                  )
                ].join("\n");
                const blob = new Blob(["\uFEFF"+csv]);
                const a = document.createElement("a");
                a.href = URL.createObjectURL(blob);
                a.download = "报告对比结果.csv";
                a.click();
              }}
              className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 text-gray-700 text-sm rounded-lg hover:bg-gray-50"
            >
              <Download className="w-4 h-4" />下载对比详情
            </button>
          </div>
        )}
      </div>
      {sidePanel && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div className="absolute inset-0 bg-black/20" onClick={() => setSidePanel(null)} />
          <div className="relative w-96 bg-white shadow-2xl h-full overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between">
              <h3 className="text-sm font-semibold text-gray-800">问题详情</h3>
              <button onClick={() => setSidePanel(null)} className="text-gray-400 hover:text-gray-600"><X className="w-5 h-5" /></button>
            </div>
            <div className="p-4 space-y-3">
              <div className="border border-gray-200 rounded-xl p-4 bg-white space-y-3">
                <div><span className="text-xs text-gray-400">序号</span><p className="text-sm text-gray-800 mt-0.5">{sidePanel.data.id}</p></div>
                <div><span className="text-xs text-gray-400">问题描述</span><p className="text-sm text-gray-800 mt-0.5">{sidePanel.data.description}</p></div>
                <div><span className="text-xs text-gray-400">图号</span><p className="text-sm text-gray-800 mt-0.5">{sidePanel.data.drawingNo}</p></div>
                <div><span className="text-xs text-gray-400">图名</span><p className="text-sm text-gray-800 mt-0.5">{sidePanel.data.drawingName}</p></div>
                <div><span className="text-xs text-gray-400">违反条文</span><p className="text-sm text-gray-800 mt-0.5">{sidePanel.data.violation}</p></div>
                <div><span className="text-xs text-gray-400">严重级</span><p className="text-sm text-gray-800 mt-0.5">{sidePanel.data.severity}</p></div>
                <div><span className="text-xs text-gray-400">状态</span><p className="text-sm mt-0.5">
                  <span className={`text-xs px-2 py-1 rounded-full border ${statusColors[sidePanel.data.status] || ""}`}>{sidePanel.data.status}</span>
                </p></div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
