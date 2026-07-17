"use client";

import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { CloudUpload, X } from "lucide-react";

export default function ReviewPanel({ projectId }) {
  const rpKey = `rp_${projectId}`;
  const [editableInfo, setEditableInfo] = useState(null);
  const [confirmed, setConfirmed] = useState(() => { try { return sessionStorage.getItem(rpKey + "_cf") === "true"; } catch { return false; } });
  const [generating, setGenerating] = useState(false);
  const [reviewResult, setReviewResult] = useState(() => { try { const s = sessionStorage.getItem(rpKey + "_rs"); return s ? JSON.parse(s) : null; } catch { return null; } });
  const [showAllRegulations, setShowAllRegulations] = useState(false);
  const [hasFile, setHasFile] = useState(false);
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef(null);
  const [loadingProject, setLoadingProject] = useState(true);

  useEffect(() => {
    if (!projectId) { setLoadingProject(false); return; }
    const loadProjectInfo = async () => {
      try {
        const cached = sessionStorage.getItem("project_info_" + projectId);
        if (cached) {
          const parsed = JSON.parse(cached);
          setEditableInfo(parsed);
          setHasFile(true);
          setLoadingProject(false);
          return;
        }
        const res = await fetch(`/api/project-item?id=${projectId}`);
        const json = await res.json();
        if (json.success && json.data && json.data.project_info) {
          const info = typeof json.data.project_info === "string"
            ? JSON.parse(json.data.project_info)
            : json.data.project_info;
          setEditableInfo(info);
          setHasFile(true);
          sessionStorage.setItem("project_info_" + projectId, JSON.stringify(info));
        }
      } catch (e) {
        console.error("加载项目信息失败", e);
      } finally {
        setLoadingProject(false);
      }
    };
    loadProjectInfo();
  }, [projectId]);



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
      const res = await fetch("/api/projects", { method: "POST", body: formData });
      const json = await res.json();
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
      const project_info = editableInfo?.project_info || {}; const special_designs = editableInfo?.special_designs || {}; const formBody = JSON.stringify({ projectId, project_info, special_designs });
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
    if (reviewResult.regulations && reviewResult.regulations.length > 0) {
        for (const reg of reviewResult.regulations) {
          contentLines.push("  " + (reg.code_name || reg.codeName || "") + " " + (reg.code_number || reg.code_id || reg.codeId || ""));
        }
    contentLines.push("");
    contentLines.push("--- 历史高频问题 ---");
      const issuesList = (reviewResult.top_issues || reviewResult.topIssues || []);
      if (issuesList.length > 0) {
        for (const issue of issuesList) {
          contentLines.push("  " + (issue.issue_summary || issue.summary || "") + "（出现" + (issue.frequency || 0) + "次）");
          if (issue.sample_description) contentLines.push("    典型问题描述：" + issue.sample_description);
          if (issue.sample_requirement) contentLines.push("    规范要求：" + issue.sample_requirement);
        }
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

  const projectInfoKeys = ["项目名称", "项目编号", "建筑类型", "高度分类", "防火分类", "结构形式", "抗震设防烈度", "审图专业"];
  const specialDesignsKeys = ["人防", "绿建", "消防", "无障碍", "装配式", "BIM", "抗震支架", "海绵城市"];

  useEffect(() => {
    sessionStorage.setItem(rpKey + "_cf", String(confirmed));
    if (reviewResult) sessionStorage.setItem(rpKey + "_rs", JSON.stringify(reviewResult));
  }, [confirmed, reviewResult, rpKey]);

  if (loadingProject) {
    return <div className="text-center py-20 text-gray-500">加载中...</div>;
  }

  return (
    <div className="flex gap-6">
      <div className="w-1/2 space-y-6">
        <div className="bg-white border border-gray-200 rounded-xl p-6">
          <h3 className="text-base font-semibold text-gray-900 mb-4">项目信息</h3>
          <div className="grid grid-cols-2 gap-4">
            {projectInfoKeys.map((key) => (
              <div key={key}>
                <label className="text-xs text-gray-500 mb-1 block">{key}</label>
                <input type="text" value={editableInfo?.project_info?.[key] || ""} onChange={(e) => handleInfoChange("project_info", key, e.target.value)} placeholder="未提取到" className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-blue-400" />
              </div>
            ))}
          </div>
        </div>
        <div className="bg-white border border-gray-200 rounded-xl p-6">
          <h3 className="text-base font-semibold text-gray-900 mb-4">专项设计信息</h3>
          <div className="grid grid-cols-2 gap-4">
            {specialDesignsKeys.map((key) => (
              <div key={key}>
                <label className="text-xs text-gray-500 mb-1 block">{key}</label>
                <input type="text" value={editableInfo?.special_designs?.[key] || ""} onChange={(e) => handleInfoChange("special_designs", key, e.target.value)} placeholder="设计说明中未提及该专项" className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-blue-400" />
              </div>
            ))}
          </div>
        </div>
        <div className="flex gap-3">
          <Button onClick={handleConfirmGenerate} disabled={generating} className="bg-blue-600 hover:bg-blue-700 text-white">{generating ? "生成中..." : "确认生成"}</Button>
          <Button onClick={handleDownload} disabled={!confirmed} className={"bg-white border border-gray-200 " + (confirmed ? "text-blue-600 hover:bg-blue-50" : "text-gray-300 cursor-not-allowed")}>点击下载</Button>
        </div>
      </div>
      <div className="w-1/2 space-y-6">
        {reviewResult && (
          <>
            <div className="bg-white border border-gray-200 rounded-xl p-6">
              <h3 className="text-base font-semibold text-gray-900 mb-4">规范清单</h3>
              <div className="space-y-3">
                {(showAllRegulations ? (reviewResult.regulations || []) : ((reviewResult.regulations || []) || []).slice(0, 5)).map((reg, idx) => (
                  <div key={idx} className="border border-gray-100 rounded-lg p-3 bg-gray-50">
                    <p className="text-sm font-medium text-gray-900">{(reg.code_name || reg.codeName || reg.codeName)}</p>
                    {(reg.code_number || reg.code_id || reg.codeId || '') && <p className="text-xs text-blue-500 mt-0.5">{(reg.code_number || reg.code_id || reg.codeId || '')}</p>}
                    {(reg.detail || reg.reason || '') && <p className="text-xs text-gray-500 mt-1">规范要求：{(reg.detail || reg.reason || '')}</p>}
                  </div>
                ))}
              </div>
              {(reviewResult.regulations || []).length > 5 && (
                <button onClick={() => setShowAllRegulations(!showAllRegulations)} className="text-xs text-blue-600 hover:text-blue-700 mt-3">
                  {showAllRegulations ? "收起" : "查看更多（共" + (reviewResult.regulations || []).length + "条）"}
                </button>
              )}
            </div>
            <div className="bg-white border border-gray-200 rounded-xl p-6">
              <h3 className="text-base font-semibold text-gray-900 mb-4">历史高频问题</h3>
              <div className="space-y-3">
                {(reviewResult.top_issues || reviewResult.topIssues || []).map((issue, idx) => (
                  <div key={idx} className="border border-gray-100 rounded-lg p-3 bg-gray-50">
                                        <p className="text-sm font-medium text-gray-900">{issue.issue_summary || issue.summary || ""}</p>
                    <p className="text-xs text-gray-500 mt-1">问题描述：{issue.sample_description || ""}</p>
                    {(issue.sample_project || "") && <p className="text-xs text-blue-500 mt-0.5">项目：{issue.sample_project || ""}</p>}
                    {(issue.sample_requirement || "") && <p className="text-xs text-gray-500 mt-0.5">规范要求：{issue.sample_requirement}</p>}
                    <p className="text-xs text-amber-600 mt-1">出现 {issue.frequency || 0} 次</p>
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









