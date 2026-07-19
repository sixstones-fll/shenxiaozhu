"use client";
import { useState, useRef } from "react";
import { Upload, FileText, CheckCircle2, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";

interface UploadViewProps {
  state: any;
  update: (partial: any) => void;
}

const DATA_TYPES = [
  { value: "regulations", label: "规范库", desc: "上传建筑规范数据" },
  { value: "issues", label: "历史问题库", desc: "上传历史审图问题数据" },
];

const FORMAT_OPTIONS = [
  { value: "文档格式", label: "文档格式", desc: "PDF、Word 等文档" },
  { value: "结构化格式", label: "结构化格式", desc: "Excel、CSV 等表格" },
];

const SEGMENT_MODES = [
  { value: "auto", label: "自动分段", desc: "系统自动识别文档结构进行分段" },
  { value: "custom", label: "自定义分段", desc: "手动设置分段标识符和长度" },
  { value: "heading", label: "按等级分段", desc: "基于文档标题层级进行分段" },
];

const HEADING_LEVELS = [
  { value: "h1", label: "一级标题" },
  { value: "h2", label: "二级标题" },
  { value: "h3", label: "三级标题" },
  { value: "h4", label: "四级标题" },
];

const COLUMN_MAP: Record<string, { field: string; label: string }[]> = {
  regulations: [
    { field: "code_number", label: "规范编号" },
    { field: "code_name", label: "规范名称" },
    { field: "article_number", label: "条文序号" },
    { field: "article_content", label: "条文内容" },
    { field: "category", label: "分类" },
  ],
  issues: [
    { field: "issue_description", label: "问题描述" },
    { field: "major", label: "专业类别" },
    { field: "project_name", label: "项目名称" },
    { field: "building_type", label: "建筑类型" },
    { field: "designer", label: "设计人" },
    { field: "reviewer", label: "图审人" },
  ],
};

export default function UploadView({ state, update }: UploadViewProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);

  const handleFileDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) {
      update({ fileName: file.name, parsedHeaders: ["列1", "列2", "列3"], parsedPreview: [["预览数据..."]] });
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      update({ fileName: file.name, parsedHeaders: ["列1", "列2", "列3"], parsedPreview: [["预览数据..."]] });
    }
  };

  const removeFile = () => {
    update({ fileName: "", parsedHeaders: [], parsedPreview: [] });
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const wizardSteps = [
    { step: 1, label: "导入数据" },
    { step: 2, label: "数据配置" },
    { step: 3, label: "完成" },
  ];

  const toggleHeadingLevel = (level: string) => {
    const current = state.segmentHeadingLevels || [];
    if (current.includes(level)) {
      update({ segmentHeadingLevels: current.filter((l: string) => l !== level) });
    } else {
      update({ segmentHeadingLevels: [...current, level] });
    }
  };

  return (
    <div className="space-y-6">
      {/* step indicator */}
      <div className="flex items-center">
        {wizardSteps.map((s, i) => (
          <div key={s.step} className="flex items-center">
            <div className={"flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm " + (state.wizardStep === s.step ? "bg-blue-50 text-blue-700 font-medium" : state.wizardStep > s.step ? "text-green-600" : "text-gray-400")}>
              {state.wizardStep > s.step ? (
                <CheckCircle2 className="w-4 h-4" />
              ) : (
                <span className={"w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold " + (state.wizardStep === s.step ? "bg-blue-600 text-white" : "bg-gray-200 text-gray-500")}>{s.step}</span>
              )}
              <span>{s.label}</span>
            </div>
            {i < wizardSteps.length - 1 && <ChevronRight className="w-4 h-4 mx-2 text-gray-300" />}
          </div>
        ))}
      </div>

      {/* Step 1: Import Data */}
      {state.wizardStep === 1 && (
        <div className="space-y-5">
          {/* knowledge base selection */}
          <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
            <h3 className="text-base font-semibold text-gray-900">知识库选择</h3>
            <div className="grid grid-cols-2 gap-3">
              {DATA_TYPES.map(t => (
                <button key={t.value} onClick={() => update({ dataType: t.value })}
                  className={"p-4 rounded-lg border text-left transition-colors " + (state.dataType === t.value ? "border-blue-500 bg-blue-50" : "border-gray-200 hover:border-blue-300")}>
                  <div className="font-medium text-sm text-gray-900">{t.label}</div>
                  <div className="text-xs text-gray-500 mt-1">{t.desc}</div>
                </button>
              ))}
            </div>
          </div>

          {/* data format */}
          <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
            <h3 className="text-base font-semibold text-gray-900">数据类型</h3>
            <div className="flex gap-3">
              {FORMAT_OPTIONS.map(f => (
                <button key={f.value} onClick={() => update({ dataFormat: f.value })}
                  className={"flex-1 p-4 rounded-lg border text-left transition-colors " + (state.dataFormat === f.value ? "border-blue-500 bg-blue-50" : "border-gray-200 hover:border-blue-300")}>
                  <div className="font-medium text-sm text-gray-900">{f.label}</div>
                  <div className="text-xs text-gray-500 mt-1">{f.desc}</div>
                </button>
              ))}
            </div>
          </div>

          {/* file upload */}
          <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
            <h3 className="text-base font-semibold text-gray-900">上传文件</h3>
            {!state.fileName ? (
              <div className={"border-2 border-dashed rounded-lg p-8 text-center transition-colors cursor-pointer " + (dragOver ? "border-blue-400 bg-blue-50" : "border-gray-300 hover:border-blue-400 hover:bg-gray-50")}
                onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                onDragLeave={() => setDragOver(false)}
                onDrop={handleFileDrop}
                onClick={() => fileInputRef.current?.click()}>
                <Upload className="w-8 h-8 mx-auto text-gray-400 mb-2" />
                <p className="text-sm text-gray-500">拖拽文件到此处，或点击选择文件</p>
                <p className="text-xs text-gray-400 mt-1">支持 PDF、Word、Excel、TXT 格式</p>
                <input ref={fileInputRef} type="file" accept=".pdf,.docx,.doc,.xlsx,.xls,.csv,.txt" className="hidden" onChange={handleFileSelect} />
              </div>
            ) : (
              <div className="flex items-center justify-between bg-gray-50 rounded-lg p-4">
                <div className="flex items-center gap-3">
                  <FileText className="w-5 h-5 text-blue-600" />
                  <div>
                    <p className="text-sm font-medium text-gray-900">{state.fileName}</p>
                    <p className="text-xs text-gray-500">已选择</p>
                  </div>
                </div>
                <button onClick={removeFile} className="text-xs text-red-500 hover:text-red-700">移除</button>
              </div>
            )}
          </div>

          <div className="flex justify-end">
            <Button onClick={() => update({ wizardStep: 2 })} className="bg-blue-600 hover:bg-blue-700 text-white">
              下一步 <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          </div>
        </div>
      )}

      {/* Step 2: Data Config */}
      {state.wizardStep === 2 && (
        <div className="space-y-5">
          {/* segment modes */}
          <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
            <h3 className="text-base font-semibold text-gray-900">分段方式</h3>
            <div className="flex gap-3">
              {SEGMENT_MODES.map(m => (
                <button key={m.value} onClick={() => update({ segmentMode: m.value })}
                  className={"flex-1 p-3 rounded-lg border text-center transition-colors " + (state.segmentMode === m.value ? "border-blue-500 bg-blue-50" : "border-gray-200 hover:border-blue-300")}>
                  <div className="font-medium text-sm text-gray-900">{m.label}</div>
                  <div className="text-xs text-gray-500 mt-1">{m.desc}</div>
                </button>
              ))}
            </div>

            {/* auto segment config */}
            {state.segmentMode === "auto" && (
              <div className="grid grid-cols-2 gap-4 pt-2">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">分段长度（字符）</label>
                  <input type="number" value={state.segmentMaxLength || 1000} onChange={(e) => update({ segmentMaxLength: Number(e.target.value) })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">重叠长度（字符）</label>
                  <input type="number" value={state.segmentOverlap || 100} onChange={(e) => update({ segmentOverlap: Number(e.target.value) })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500" />
                </div>
              </div>
            )}

            {/* custom segment config */}
            {state.segmentMode === "custom" && (
              <div className="grid grid-cols-2 gap-4 pt-2">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">分段标识符</label>
                  <input type="text" value={state.segmentDelimiter || ""} onChange={(e) => update({ segmentDelimiter: e.target.value })} placeholder="例如：### 或 \\n\\n"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">最小分段长度（字符）</label>
                  <input type="number" value={state.segmentMinLength || 200} onChange={(e) => update({ segmentMinLength: Number(e.target.value) })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500" />
                </div>
              </div>
            )}

            {/* heading segment config */}
            {state.segmentMode === "heading" && (
              <div className="space-y-3 pt-2">
                <label className="block text-xs font-medium text-gray-700">标题层级（可多选）</label>
                <div className="flex gap-2 flex-wrap">
                  {HEADING_LEVELS.map(h => (
                    <button key={h.value} onClick={() => toggleHeadingLevel(h.value)}
                      className={"px-3 py-1.5 rounded-lg text-xs border transition-colors " + ((state.segmentHeadingLevels || []).includes(h.value) ? "bg-blue-50 border-blue-400 text-blue-700" : "border-gray-200 text-gray-500 hover:border-gray-300")}>
                      {h.label}
                    </button>
                  ))}
                </div>
                <div className="mt-2">
                  <label className="block text-xs font-medium text-gray-700 mb-1">分段长度（字符）</label>
                  <input type="number" value={state.segmentMaxLength || 1000} onChange={(e) => update({ segmentMaxLength: Number(e.target.value) })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500" />
                </div>
              </div>
            )}
          </div>

          {/* column mapping */}
          <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
            <h3 className="text-base font-semibold text-gray-900">字段映射配置</h3>
            {state.dataType && COLUMN_MAP[state.dataType] ? (
              <div className="border border-gray-200 rounded-lg overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50">
                    <tr>
                      {COLUMN_MAP[state.dataType].map((col: any, i: number) => (
                        <th key={i} className="px-3 py-2 text-left text-xs font-medium text-gray-500 border-r border-gray-200 last:border-r-0">{col.label}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {state.parsedPreview.length > 0 ? state.parsedPreview.map((row: string[], ri: number) => (
                      <tr key={ri} className="border-t border-gray-100">
                        {COLUMN_MAP[state.dataType].map((col: any, ci: number) => (
                          <td key={ci} className="px-3 py-2 text-xs text-gray-500 border-r border-gray-200 last:border-r-0">{row[ci] || "-"}</td>
                        ))}
                      </tr>
                    )) : (
                      <tr>
                        <td colSpan={COLUMN_MAP[state.dataType].length} className="px-3 py-4 text-center text-xs text-gray-400">暂无数据，请先上传文件</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-sm text-gray-400 text-center py-4">请先选择知识库类型</p>
            )}
          </div>

          <div className="flex justify-between">
            <Button variant="outline" onClick={() => update({ wizardStep: 1 })}>上一步</Button>
            <Button onClick={() => update({ wizardStep: 3 })} className="bg-blue-600 hover:bg-blue-700 text-white">
              完成配置 <CheckCircle2 className="w-4 h-4 ml-1" />
            </Button>
          </div>
        </div>
      )}

      {/* Step 3: Done */}
      {state.wizardStep === 3 && (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center space-y-4">
          <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-8 h-8 text-green-600" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900">数据导入完成</h3>
          <div className="text-sm text-gray-500 space-y-1">
            <p>知识库：{DATA_TYPES.find(t => t.value === state.dataType)?.label || "-"}</p>
            <p>数据类型：{state.dataFormat || "-"}</p>
            {state.fileName && <p>上传文件：{state.fileName}</p>}
            <p>分段方式：{SEGMENT_MODES.find(m => m.value === state.segmentMode)?.label || "-"}</p>
          </div>
          <div className="pt-4">
            <Button variant="outline" onClick={() => update({ wizardStep: 2 })}>返回修改</Button>
            <Button onClick={() => { update({ uploadComplete: true, mainTab: "regulations" }); }} className="bg-blue-600 hover:bg-blue-700 text-white ml-3">返回知识库</Button>
          </div>
        </div>
      )}
    </div>
  );
}