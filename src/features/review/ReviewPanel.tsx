"use client";

import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { CloudUpload, X } from "lucide-react";
import type { EditableReviewInfo, ReviewResult } from "./types";
import { generateReview, uploadAndExtract } from "./api";

export default function ReviewPanel({ projectInfo, projectId }) {
  const [editableInfo, setEditableInfo] = useState(null);
  const [confirmed, setConfirmed] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [reviewResult, setReviewResult] = useState(null);
  const [showAllRegulations, setShowAllRegulations] = useState(false);
  const [hasFile, setHasFile] = useState(!!projectInfo);
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);

  const fileInputRef = useRef(null);

  useEffect(() => {
    if (projectInfo && !editableInfo) {
      const info = typeof projectInfo === "string" ? JSON.parse(projectInfo) : projectInfo;
      setEditableInfo(info);
      setHasFile(true);
    }
  }, [projectInfo]);

  const handleInfoChange = (section, key, value) => {
    setEditableInfo((prev) => {
      const next = JSON.parse(JSON.stringify(prev));
      next[section][key] = value || null;
      return next;
    });
  };

  const handleUploadFile = async () => {
    if (!file) return;
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("name", "项目文件更新");
      formData.append("file", file);
      formData.append("project_id", projectId);
      const json = await fetch("/api/projects", { method: "POST", body: formData }); const data = await json.json();
      const info = json.data?.project_info || { project_info: {}, special_designs: {} };
      setEditableInfo(info);
      setHasFile(true);
      sessionStorage.setItem("project_" + projectId, JSON.stringify({ name: json.data?.project_name || "未命名项目", project_info: info }));
    } catch (e) {
      console.error("上传失败", e);
    } finally {
      setUploading(false);
    }
  };

  const handleConfirmGenerate = async () => {
    setGenerating(true);
    try {
      const formBody = JSON.stringify({ projectId, projectInfo: editableInfo });
      const res = await fetch("/api/review/generate", { method: "POST", headers: { "Content-Type": "application/json" }, body: formBody });
      const json = await res.json();
      if (json.success && json.data) {
        setReviewResult(json.data);
        setConfirmed(true);
      } else {
        alert("生成审图清单失败: " + (json.error || "未知错误"));
      }
    } catch (e) {
      alert("生成审图清单失败，请稍后重试");
    } finally {
      setGenerating(false);
    }
  };

  const handleDownload = () => {
    if (!reviewResult) return;
    const projectName = editableInfo?.project_info?.项目名称 || "未命名项目";
    const contentLines = [];
    contentLines.push("===== " + projectName + " - 审图清单 =====");
    contentLines.push("");
    contentLines.push("--- 项目信息 ---");
    if (editableInfo?.project_info) {
      const pi = editableInfo.project_info;
      for (const [key, value] of Object.entries(pi)) {
        if (value) contentLines.push(key + ": " + value);
      }
    }
    contentLines.push("");
    contentLines.push("--- 专项设计信息 ---");
    if (editableInfo?.special_designs) {
      const sd = editableInfo.special_designs;
      for (const [key, value] of Object.entries(sd)) {
        if (value) contentLines.push(key + ": " + (value === true || value === "是" ? "涉及" : value));
      }
    }
    contentLines.push("");
    contentLines.push("--- 规范清单 ---");
    if ((reviewResult.regulations || []) && (reviewResult.regulations || []).length > 0) {
      const displayRegs = (reviewResult.regulations || []).slice(0, 5);
      for (const reg of displayRegs) {
        contentLines.push("  " + reg.codeName + " " + (reg.codeId || ""));
        if (reg.detail) contentLines.push("    要求: " + reg.detail);
      }
      if ((reviewResult.regulations || []).length > 5) {
        contentLines.push("  ...共" + (reviewResult.regulations || []).length + "条规范");
      }
    }
    contentLines.push("");
    contentLines.push("--- 历史高频问题 ---");
    if ((reviewResult.top_issues || reviewResult.topIssues || []) && (reviewResult.top_issues || reviewResult.topIssues || []).length > 0) {
      for (const issue of (reviewResult.top_issues || reviewResult.topIssues || [])) {
        contentLines.push("  " + issue.summary + "（出现" + issue.frequency + "次）");
        if (issue.sample_requirement) contentLines.push("    规范要求: " + issue.sample_requirement);
      }
    }
    const blob = new Blob([contentLines.join("\n")], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "审图清单_" + projectName + ".txt";
    a.click();
    URL.revokeObjectURL(url);
  };

  if (!editableInfo && !hasFile) {
    return (
      <div className="space-y-6">
        <form onSubmit={(e) => { e.preventDefault(); handleUploadFile(); }} className="space-y-6">
          <div onClick={() => fileInputRef.current?.click()} className="border-2 border-dashed border-gray-200 rounded-lg p-12 text-center cursor-pointer hover:border-blue-300 transition-colors">
            <input ref={fileInputRef} type="file" className="hidden" accept=".pdf,.docx,.doc,.txt"
              onChange={(e) => { const f = e.target.files?.[0]; if (f) setFile(f); }} />
            <CloudUpload className="w-12 h-12 text-blue-600 mx-auto mb-3" />
            <p className="text-sm text-gray-600">点击或拖拽上传项目设计说明</p>
            <p className="text-xs text-gray-400 mt-1">支持 PDF、DOCX、DOC、TXT 格式</p>
          </div>
          <div className="flex gap-2">
            <Button type="submit" disabled={!file || uploading} className="bg-blue-600 hover:bg-blue-700 text-white flex-1">
              {uploading ? "上传中..." : "确认提交"}
            </Button>
            <Button type="button" onClick={() => handleConfirmGenerate()} className="bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 flex-1">
              暂不上传，直接开启新项目
            </Button>
          </div>
        </form>
      </div>
    );
  }

  const projectInfoKeys = ["项目名称", "项目编号", "建筑类型", "高度分类", "防火分类", "结构形式", "抗震设防烈度", "审图专业"];
  const specialDesignsKeys = ["人防", "绿建", "消防", "无障碍", "装配式", "BIM", "抗震支架", "海绵城市"];

  return (
    <div className="flex gap-6">

      {/* ?????? */}
      <div className="w-1/2 space-y-6">
        <div className="bg-white border border-gray-200 rounded-xl p-6">
          <h3 className="text-base font-semibold text-gray-900 mb-4">????</h3>
          <div className="grid grid-cols-2 gap-4">
            {projectInfoKeys.map((key) => (
              <div key={key}>
                <label className="text-xs text-gray-500 mb-1 block">{key}</label>
                <input
                  type="text"
                  value={editableInfo?.project_info?.[key] || ""}
                  onChange={(e) => handleInfoChange("project_info", key, e.target.value)}
                  placeholder="????"
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-blue-400"
                />
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-xl p-6">
          <h3 className="text-base font-semibold text-gray-900 mb-4">??????</h3>
          <div className="grid grid-cols-2 gap-4">
            {specialDesignsKeys.map((key) => (
              <div key={key}>
                <label className="text-xs text-gray-500 mb-1 block">{key}</label>
                <input
                  type="text"
                  value={editableInfo?.special_designs?.[key] || ""}
                  onChange={(e) => handleInfoChange("special_designs", key, e.target.value)}
                  placeholder="???????????"
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-blue-400"
                />
              </div>
            ))}
          </div>
        </div>

        <div className="flex gap-3">
          <Button onClick={handleConfirmGenerate} disabled={generating} className="bg-blue-600 hover:bg-blue-700 text-white">
            {generating ? "???..." : "????"}
          </Button>
          <Button onClick={handleDownload} disabled={!confirmed} className={"border border-gray-200 " + (confirmed ? "text-blue-600 hover:bg-blue-50" : "text-gray-400 cursor-not-allowed")}>
            ????
          </Button>
        </div>
      </div>

      {/* ?????? */}
      <div className="w-1/2 space-y-6">
        {reviewResult && (
          <>
            <div className="bg-white border border-gray-200 rounded-xl p-6">
              <h3 className="text-base font-semibold text-gray-900 mb-4">????</h3>
              <div className="space-y-3">
                {(showAllRegulations ? (reviewResult.regulations || []) : ((reviewResult.regulations || []) || []).slice(0, 5)).map((reg, idx) => (
                  <div key={idx} className="border border-gray-100 rounded-lg p-3 bg-gray-50">
                    <p className="text-sm font-medium text-gray-900">{reg.codeName}</p>
                    {reg.codeId && <p className="text-xs text-blue-500 mt-0.5">{reg.codeId}</p>}
                    {reg.detail && <p className="text-xs text-gray-500 mt-1">?????{reg.detail}</p>}
                  </div>
                ))}
              </div>
              {(reviewResult.regulations || []).length > 5 && (
                <button
                  onClick={() => setShowAllRegulations(!showAllRegulations)}
                  className="text-xs text-blue-600 hover:text-blue-700 mt-3"
                >
                  {showAllRegulations ? "??" : "??????" + (reviewResult.regulations || []).length + "??"}
                </button>
              )}
            </div>

            <div className="bg-white border border-gray-200 rounded-xl p-6">
              <h3 className="text-base font-semibold text-gray-900 mb-4">??????</h3>
              <div className="space-y-3">
                {(reviewResult.top_issues || reviewResult.topIssues || []).map((issue, idx) => (
                  <div key={idx} className="border border-gray-100 rounded-lg p-3 bg-gray-50">
                    <p className="text-sm font-medium text-gray-900">{"?? #" + (idx + 1)}</p>
                    <p className="text-xs text-gray-500 mt-1">?????{issue.summary}</p>
                    {issue.sample_requirement && (
                      <p className="text-xs text-gray-500 mt-0.5">?????{issue.sample_requirement}</p>
                    )}
                    <p className="text-xs text-amber-600 mt-1">?? {issue.frequency} ?</p>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}