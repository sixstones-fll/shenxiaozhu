"use client";

import { useState, useRef } from "react";
import { Plus, Trash2, Edit3, Wand2, ImageUp } from "lucide-react";

interface IssueRow {
  id: string;
  seq: number;
  description: string;
  drawingNo: string;
  drawingName: string;
  violation: string;
  severity: string;
  specialty: string[];
  reply: string;
  status: string;
  screenshot: string | null;
}

export default function ReportPanel({ projectId }: { projectId: string }) {
  const storageKey = "report_issues_" + projectId;
  const [rows, setRows] = useState<IssueRow[]>(() => {
    try {
      const saved = sessionStorage.getItem(storageKey);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  const [activeRowId, setActiveRowId] = useState<string | null>(null);
  const [inputText, setInputText] = useState("");
  const [transcribing, setTranscribing] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [specialtyOpen, setSpecialtyOpen] = useState<string | null>(null);
  const [specialtyBtnRect, setSpecialtyBtnRect] = useState({top:0, left:0});
  const [screenshotTargetId, setScreenshotTargetId] = useState<string | null>(null);

  const saveRows = (newRows: IssueRow[]) => {
    setRows(newRows);
    try {
      sessionStorage.setItem(storageKey, JSON.stringify(newRows));
    } catch {}
  };

  const addRow = () => {
    const newRow: IssueRow = {
      id: Math.random().toString(36).substring(2, 10),
      seq: rows.length + 1,
      description: "",
      drawingNo: "",
      drawingName: "",
      violation: "",
      severity: "普通",
      specialty: ["建筑"],
      reply: "",
      status: "待整改",
      screenshot: null,
    };
    saveRows([...rows, newRow]);
    setActiveRowId(newRow.id);
    setTimeout(() => inputRef.current?.focus(), 100);
  };

  const deleteRow = (id: string) => {
    const filtered = rows.filter((r) => r.id !== id);
    const reindexed = filtered.map((r, i) => ({ ...r, seq: i + 1 }));
    saveRows(reindexed);
    if (activeRowId === id) {
      setActiveRowId(null);
      setInputText("");
    }
  };

  const handleRowClick = (id: string) => {
    setActiveRowId(id);
    const row = rows.find((r) => r.id === id);
    if (row) {
      setInputText(row.description + (row.drawingNo ? " " + row.drawingNo : "") + (row.drawingName ? " " + row.drawingName : ""));
    }
    setTimeout(() => inputRef.current?.focus(), 100);
  };

  const handleTranscribe = async () => {
    if (!inputText.trim() || !activeRowId || transcribing) return;
    setTranscribing(true);
    try {
      const res = await fetch("/api/report/transcribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ description: inputText.trim() }),
      });
      const json = await res.json();
      if (json.success && json.data) {
        const updated = rows.map((r) =>
          r.id === activeRowId
            ? {
                ...r,
                description: json.data.description || r.description,
                drawingNo: json.data.drawingNo || r.drawingNo,
                drawingName: json.data.drawingName || r.drawingName,
                violation: json.data.violation || r.violation,
                severity: json.data.severity || r.severity,
                specialty: Array.isArray(json.data.specialty) ? json.data.specialty : (json.data.specialty ? [json.data.specialty] : r.specialty),
                reply: json.data.reply ?? r.reply,
                status: json.data.status ?? r.status,
              }
            : r
        );
        saveRows(updated);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setTranscribing(false);
    }
  };

  const updateField = (id: string, field: keyof IssueRow, value: string) => {
    const updated = rows.map((r) => (r.id === id ? { ...r, [field]: value } : r));
    saveRows(updated);
  };

  const handleScreenshotClick = (id: string) => {
    setScreenshotTargetId(id);
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !screenshotTargetId) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const dataUrl = ev.target?.result as string;
      const updated = rows.map((r) => (r.id === screenshotTargetId ? { ...r, screenshot: dataUrl } : r));
      saveRows(updated);
      setScreenshotTargetId(null);
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  const severityColors: Record<string, string> = {
    "一类强条": "bg-red-50 text-red-700 border-red-200",
    "二类强条": "bg-orange-50 text-orange-700 border-orange-200",
    "普通": "bg-gray-50 text-gray-600 border-gray-200",
  };


  const handleImportReport = () => {
    var inp = document.createElement("input");
    inp.type = "file";
    inp.accept = ".json";
    inp.onchange = function(ev) {
      var file = ev.target.files[0];
      if (!file) return;
      var reader = new FileReader();
      reader.onload = function(e) {
        try {
          var data = JSON.parse(e.target.result);
          if (Array.isArray(data)) {
            saveRows(data.map(function(t,i) {
              return {
                id: Math.random().toString(36).substring(2,10),
                seq: i + 1,
                description: t.description || "",
                drawingNo: t.drawingNo || "",
                drawingName: t.drawingName || "",
                violation: t.violation || "",
                severity: t.severity || "普通",
                specialty: Array.isArray(t.specialty) ? t.specialty : [t.specialty || "建筑"],
                screenshot: null,
                reply: t.reply || "",
                status: t.status || "待整改"
              };
            }));
          }
        } catch(ex) {
          console.error(ex);
        }
      };
      reader.readAsText(file);
    };
    inp.click();
  };

  const handleExportWord = async () => {
    if (rows.length === 0) return;
    try {
      const { Packer, Document, Table, TableRow, TableCell, Paragraph, TextRun, WidthType, AlignmentType } = await import("docx");

      const headerRow = new TableRow({
        tableHeader: true,
        children: ["序号", "问题描述", "图号", "图名", "违反条文", "严重级", "涉及专业", "问题回复", "整改状态"].map(
          (text) =>
            new TableCell({
              width: { size: text === "问题描述" || text === "违反条文" ? 3000 : 1500, type: WidthType.DXA },
              shading: { fill: "E5E7EB" },
              children: [
                new Paragraph({
                  alignment: AlignmentType.CENTER,
                  children: [new TextRun({ text, bold: true, size: 18, font: "SimSun" })],
                }),
              ],
            })
        ),
      });

      const dataRows = rows.map(
        (r) =>
          new TableRow({
            children: [r.seq.toString(), r.description, r.drawingNo, r.drawingName, r.violation, r.severity, Array.isArray(r.specialty) ? r.specialty.join(", ") : r.specialty, r.reply || "", r.status || "待整改"].map(
              (text) =>
                new TableCell({
                  width: { size: text === r.description || text === r.violation ? 3000 : 1500, type: WidthType.DXA },
                  children: [
                    new Paragraph({
                      alignment: AlignmentType.CENTER,
                      children: [new TextRun({ text: text || "", size: 18, font: "SimSun" })],
                    }),
                  ],
                })
            ),
          })
      );

      const doc = new Document({
        sections: [
          {
            children: [
              new Paragraph({
                alignment: AlignmentType.CENTER,
                children: [new TextRun({ text: "施工图审查报告", bold: true, size: 28, font: "SimHei" })],
              }),
              new Paragraph({ spacing: { after: 200 }, children: [] }),
              new Table({
                width: { size: 100, type: WidthType.PERCENTAGE },
                rows: [headerRow, ...dataRows],
              }),
            ],
          },
        ],
      });

      const blob = await Packer.toBlob(doc);
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "审查报告.docx";
      a.click();
      URL.revokeObjectURL(url);
    } catch (e) {
      console.error("[REPORT] Export error:", e);

      // Fallback: simple CSV export
      const header = ["序号", "问题描述", "图号", "图名", "违反条文", "严重级", "涉及专业", "问题回复", "整改状态"];
      const csvRows = rows.map(r => [r.seq, r.description, r.drawingNo, r.drawingName, r.violation, r.severity, Array.isArray(r.specialty) ? r.specialty.join(", ") : r.specialty, r.reply || "", r.status || "待整改"]);
      const csv = [header.join(","), ...csvRows.map(r => r.map(v => '"' + (v || "").replace(/"/g, '""') + '"').join(","))].join("\n");
      const blob = new Blob(["\ufeff" + csv], { type: "text/csv;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "审查报告.csv";
      a.click();
      URL.revokeObjectURL(url);
    }
  };  return (
    <div className="flex flex-col h-full">
      {/* Scrollable content area */}
      <div className="flex-1 overflow-y-auto px-6 pt-4 pb-4">
        <div className="flex items-center justify-between mb-3">
          <div></div>
          <div className="flex gap-2">
          <button
            onClick={handleImportReport}
            className="h-9 px-4 bg-white border border-gray-200 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-50 flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>
            导入报告
          </button>
          <button
            onClick={handleExportWord}
            className="h-9 px-4 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
            导出报告
          </button>
        </div>
        </div>

        <div className="border border-gray-200 rounded-xl overflow-hidden">
          <table className="w-full text-sm" style={{tableLayout:"fixed"}}>
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="w-12 px-3 py-3 text-xs font-medium text-gray-500 text-center">#</th>
                <th className="px-3 py-3 text-xs font-medium text-gray-500 text-left">问题描述</th>
                <th className="w-24 px-3 py-3 text-xs font-medium text-gray-500 text-left">图号</th>
                <th className="w-24 px-3 py-3 text-xs font-medium text-gray-500 text-left">图名</th>
                <th className="px-3 py-3 text-xs font-medium text-gray-500 text-left">违反条文</th>
                <th className="w-24 px-3 py-3 text-xs font-medium text-gray-500 text-center">严重级</th>
                <th className="w-20 px-3 py-3 text-xs font-medium text-gray-500 text-center">涉及专业</th>
                <th className="w-28 px-3 py-3 text-xs font-medium text-gray-500 text-left">问题回复</th>
                <th className="w-20 px-3 py-3 text-xs font-medium text-gray-500 text-center">整改状态</th>
                <th className="w-16 px-3 py-3 text-xs font-medium text-gray-500 text-center">截图</th>
                <th className="w-16 px-3 py-3 text-xs font-medium text-gray-500 text-center">操作</th>
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 ? (
                <tr>
                  <td style={{height:48}} colSpan={11} className="px-3 py-12 text-center text-gray-400 text-sm">
                    暂无问题，点击下方按钮添加
                  </td>
                </tr>
              ) : (
                rows.map((row) => (
                  <tr style={{height:48}}
                    key={row.id}
                    className={`border-b border-gray-100 hover:bg-gray-50 transition-colors ${activeRowId === row.id ? "bg-blue-50/60" : ""}`}
                  >
                    <td
                      className="px-3 py-3 text-center cursor-pointer select-none"
                      onClick={() => handleRowClick(row.id)}
                    >
                      <span className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-medium transition-colors ${activeRowId === row.id ? "bg-blue-600 text-white shadow-sm" : "bg-blue-50 text-blue-600 hover:bg-blue-100"}`}>
                        {row.seq}
                      </span>
                    </td>
                    <td style={{height:48}} className="px-3 py-3">
                      <input
                        type="text"
                        value={row.description}
                        onChange={(e) => updateField(row.id, "description", e.target.value)}
                        className="w-full bg-transparent text-gray-800 focus:outline-none focus:text-blue-600 text-sm truncate"
                        placeholder="输入问题描述"
                      />
                    </td>
                    <td style={{height:48}} className="px-3 py-3">
                      <input
                        type="text"
                        value={row.drawingNo}
                        onChange={(e) => updateField(row.id, "drawingNo", e.target.value)}
                        className="w-full bg-transparent text-gray-800 focus:outline-none focus:text-blue-600 text-sm"
                        placeholder="建施-01"
                      />
                    </td>
                    <td style={{height:48}} className="px-3 py-3">
                      <input
                        type="text"
                        value={row.drawingName}
                        onChange={(e) => updateField(row.id, "drawingName", e.target.value)}
                        className="w-full bg-transparent text-gray-800 focus:outline-none focus:text-blue-600 text-sm"
                        placeholder="一层平面图"
                      />
                    </td>
                    <td style={{height:48}} className="px-3 py-3">
                      <input
                        type="text"
                        value={row.violation}
                        onChange={(e) => updateField(row.id, "violation", e.target.value)}
                        className="w-full bg-transparent text-gray-800 focus:outline-none focus:text-blue-600 text-sm"
                        placeholder="规范条文"
                      />
                    </td>
                    <td style={{height:48}} className="px-3 py-3 text-center">
                      <select
                        value={row.severity}
                        onChange={(e) => updateField(row.id, "severity", e.target.value)}
                        className={`text-xs px-2 py-1 rounded-full border focus:outline-none cursor-pointer ${
                          row.severity === "一类强条" ? "bg-red-50 text-red-700 border-red-200" :
                          row.severity === "二类强条" ? "bg-orange-50 text-orange-700 border-orange-200" :
                          "bg-gray-50 text-gray-600 border-gray-200"
                        }`}
                      >
                        <option value="一类强条">一类强条</option>
                        <option value="二类强条">二类强条</option>
                        <option value="普通">普通</option>
                      </select>
                    </td>
                    <td style={{height:48}} className="px-3 py-3 text-center">
                      <div className="relative inline-block">
                        <button
                          onClick={(e) => {
                            const rect = e.currentTarget.getBoundingClientRect();
                            setSpecialtyBtnRect({top: rect.bottom, left: rect.left});
                            setSpecialtyOpen(specialtyOpen === row.id ? null : row.id);
                          }}
                          className="text-xs px-2 py-1 rounded border border-gray-200 text-gray-600 hover:border-blue-300 focus:outline-none cursor-pointer flex items-center gap-1 min-w-0"
                        >
                          <span className="truncate">{Array.isArray(row.specialty) && row.specialty.length > 0
                            ? row.specialty[0] + (row.specialty.length > 1 ? " +" + row.specialty.length : "")
                            : "选择专业"}</span>
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                        </button>
                        {specialtyOpen === row.id && (
                          <div style={{position:"fixed", top:specialtyBtnRect.top, left:specialtyBtnRect.left, zIndex:9999}} className="mt-1 bg-white border border-gray-200 rounded-lg shadow-lg p-2 text-left whitespace-nowrap">
                            {["建筑", "结构", "给排水", "暖通", "电气"].map((s) => (
                              <label key={s} className="flex items-center gap-2 px-2 py-1 text-xs text-gray-700 hover:bg-gray-50 cursor-pointer rounded">
                                <input
                                  type="checkbox"
                                  checked={Array.isArray(row.specialty) && row.specialty.includes(s)}
                                  onChange={() => {
                                    const current = Array.isArray(row.specialty) ? row.specialty : [];
                                    const next = current.includes(s) ? current.filter((x) => x !== s) : [...current, s];
                                    updateField(row.id, "specialty", next);
                                  }}
                                  className="w-3 h-3"
                                />
                                {s}
                              </label>
                            ))}
                          </div>
                        )}
                      </div>
                    </td>
                    <td style={{height:48}} className="px-3 py-3">
                      <input
                        type="text"
                        value={row.reply || ""}
                        onChange={(e) => updateField(row.id, "reply", e.target.value)}
                        className="w-full bg-transparent text-gray-800 focus:outline-none focus:text-blue-600 text-sm"
                        placeholder="输入问题回复"
                      />
                    </td>
                    <td style={{height:48}} className="px-3 py-3 text-center">
                      <select
                        value={row.status || "待整改"}
                        onChange={(e) => updateField(row.id, "status", e.target.value)}
                        className={"text-xs px-2 py-1 rounded-full border focus:outline-none cursor-pointer " + (row.status === "已整改" ? "bg-green-50 text-green-700 border-green-200" : row.status === "新增" ? "bg-yellow-50 text-yellow-700 border-yellow-200" : "bg-blue-50 text-blue-700 border-blue-200")}
                      >
                        <option value="待整改">待整改</option>
                        <option value="已整改">已整改</option>
                        <option value="新增">新增</option>
                      </select>
                    </td>
                    <td style={{height:48}} className="px-3 py-3 text-center">
                      <button
                        onClick={() => handleScreenshotClick(row.id)}
                        className="text-gray-400 hover:text-blue-600 transition-colors"
                        title={row.screenshot ? "已上传截图" : "上传截图"}
                      >
                        {row.screenshot ? (
                          <div className="relative inline-block">
                            <img
                              src={row.screenshot}
                              alt="截图"
                              className="w-8 h-8 object-cover rounded border border-gray-200"
                            />
                          </div>
                        ) : (
                          <svg className="w-4 h-4 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                        )}
                      </button>
                    </td>
                    <td style={{height:48}} className="px-3 py-3 text-center">
                      <div className="flex items-center justify-center">
                        <button
                          onClick={() => deleteRow(row.id)}
                          className="w-7 h-7 flex items-center justify-center rounded text-red-500 hover:bg-red-50 transition-colors"
                          title="删除"
                        >
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <button
          onClick={addRow}
          className="mt-4 w-full py-3 border-2 border-dashed border-gray-200 rounded-xl text-sm text-gray-400 hover:text-blue-600 hover:border-blue-300 transition-colors flex items-center justify-center gap-2"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
          添加问题
        </button>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFileChange}
      />

      {/* Bottom input bar - fixed at bottom */}
      <div className="border-t border-gray-200 px-6 py-3 bg-white">
        <div className="flex items-center gap-3">
          <input
            ref={inputRef}
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleTranscribe();
              }
            }}
            placeholder={activeRowId ? "输入问题概述、图号、图名..." : "请先点击某行序号激活输入"}
            className="flex-1 h-10 px-4 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 placeholder-gray-400"
            disabled={!activeRowId}
          />
          <button
            onClick={handleTranscribe}
            disabled={!activeRowId || !inputText.trim() || transcribing}
            className="h-10 px-4 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 whitespace-nowrap"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
            {transcribing ? "转写中..." : "转写本条问题"}
          </button>
        </div>
      </div>
    </div>
  );
}
