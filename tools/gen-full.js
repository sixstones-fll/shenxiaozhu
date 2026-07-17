const fs = require("fs");
const path = require("path");

const content = `"use client";

import { Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { PlusCircle, CloudUpload, X } from "lucide-react";
import { supabase } from "@/lib/supabase/client";

type Project = {
  id: string;
  name: string;
  description: string | null;
  created_at: string;
  project_info: any | null;
};

const tabs = [
  { key: "code", label: "规范问答" },
  { key: "review", label: "审图规划" },
  { key: "report", label: "报告生成" },
  { key: "compare", label: "报告对比" },
  { key: "issues", label: "问题追踪" },
];

function ProjectsPageContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const projectId = searchParams.get("id");
  const tabParam = searchParams.get("tab");
  const [activeTab, setActiveTab] = useState(tabParam || "review");
  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!projectId) { setLoading(false); return; }
    const fetchProject = async () => {
      try {
        const cached = sessionStorage.getItem(\`project_\${projectId}\`);
        if (cached) {
          try {
            const parsed = JSON.parse(cached);
            setProject({
              id: projectId,
              name: parsed.name || "未命名项目",
              description: null,
              created_at: new Date().toISOString(),
              project_info: parsed.project_info || null,
            });
            sessionStorage.removeItem(\`project_\${projectId}\`);
            setLoading(false);
            return;
          } catch (e) {}
        }
        const res = await fetch(\`/api/project-item?id=\${projectId}\`);
        const json = await res.json();
        if (json.success && json.data) {
          setProject(json.data);
        } else {
          console.error("获取项目失败:", json.error);
        }
      } catch (e) {
        console.error("获取项目失败", e);
      } finally {
        setLoading(false);
      }
    };
    fetchProject();
  }, [projectId]);

  const handleTabChange = (key) => {
    setActiveTab(key);
    const params = new URLSearchParams(searchParams);
    params.set("tab", key);
    router.replace(\`/projects?\${params.toString()}\`, { scroll: false });
  };

  if (!projectId) {
    return (
      <div className="flex flex-col items-center justify-center h-full py-20 text-center">
        <h2 className="text-xl font-bold text-gray-900 mb-2">暂无项目</h2>
        <p className="text-sm text-gray-500 mb-6">您还没有创建任何项目，点击下方按钮开始</p>
        <Link href="/projects/new">
          <Button className="bg-blue-600 hover:bg-blue-700 text-white">
            <PlusCircle className="w-4 h-4 mr-2" /> 新建项目
          </Button>
        </Link>
      </div>
    );
  }

  if (loading) {
    return <div className="text-center py-20 text-gray-500">加载中...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">{project?.name || "未命名项目"}</h1>
          <p className="text-sm text-gray-500 mt-1">创建时间：{project?.created_at ? new Date(project.created_at).toLocaleDateString() : "--"}</p>
        </div>
      </div>
      <div className="border-b border-gray-200">
        <nav className="flex gap-8">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => handleTabChange(tab.key)}
              className={\`pb-3 text-sm font-medium border-b-2 transition-colors \${activeTab === tab.key ? "border-blue-600 text-blue-600" : "border-transparent text-gray-500 hover:text-gray-700"}\`}>{tab.label}</button>
          ))}
        </nav>
      </div>
      <div className="bg-white rounded-xl border border-gray-200 p-8 min-h-[300px]">
        {activeTab === "review" && <ReviewPanel projectInfo={project?.project_info} projectId={projectId || ""} />}
        {activeTab === "code" && <div className="text-center text-gray-500"><p className="text-base font-medium mb-2">规范问答</p><p className="text-sm">功能开发中...</p></div>}
        {activeTab === "report" && <div className="text-center text-gray-500"><p className="text-base font-medium mb-2">报告生成</p><p className="text-sm">功能开发中...</p></div>}
        {activeTab === "compare" && <div className="text-center text-gray-500"><p className="text-base font-medium mb-2">报告对比</p><p className="text-sm">功能开发中...</p></div>}
        {activeTab === "issues" && <div className="text-center text-gray-500"><p className="text-base font-medium mb-2">问题追踪</p><p className="text-sm">功能开发中...</p></div>}
      </div>
    </div>
  );
}

function ReviewPanel({ projectInfo, projectId }) {
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
    if (projectInfo) {
      setEditableInfo(JSON.parse(JSON.stringify(projectInfo)));
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
      const res = await fetch("/api/review/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ project_info: editableInfo?.project_info || {}, special_designs: editableInfo?.special_designs || {} }),
      });
      const json = await res.json();
      if (json.success) {
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
          {file && (
            <div className="flex items-center gap-2 text-sm text-gray-700 bg-gray-50 rounded-lg px-4 py-2">
              <span>{file.name}</span>
              <button type="button" onClick={() => setFile(null)} className="ml-auto text-gray-400 hover:text-gray-600"><X className="w-4 h-4" /></button>
            </div>
          )}
          <Button type="submit" disabled={!file || uploading} className="w-full h-11 bg-blue-600 hover:bg-blue-700 text-white">{uploading ? "提交中..." : "确认提交"}</Button>
        </form>
      </div>
    );
  }

  const projectData = editableInfo?.project_info || {};
  if (!projectData["审图专业"]) { projectData["审图专业"] = "建筑专业"; }
  const specialData = editableInfo?.special_designs || {};
  const projectKeys = Object.keys(projectData).filter(k => k !== "审图专业").concat("审图专业");
  const specialKeys = Object.keys(specialData);

  if (confirmed && reviewResult) {
    const regulations = reviewResult.regulations || [];
    const topIssues = reviewResult.top_issues || [];
    const displayRegulations = showAllRegulations ? regulations : regulations.slice(0, 5);

    return (
      <div className="flex gap-6">
        <div className="w-[380px] shrink-0 space-y-4">
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <h3 className="text-sm font-semibold text-gray-900 mb-3">项目信息</h3>
            <div className="space-y-3">
              {projectKeys.map((key) => (
                <div key={key}>
                  <p className="text-xs text-gray-500">{key}</p>
                  <p className="text-sm font-medium text-gray-900">{projectData[key] || "未提取到"}</p>
                </div>
              ))}
            </div>
          </div>
          {specialKeys.length > 0 && (
            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <h3 className="text-sm font-semibold text-gray-900 mb-3">专项设计信息</h3>
              <div className="space-y-3">
                {specialKeys.map((key) => (
                  <div key={key}>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-medium text-blue-600 bg-blue-50 px-2 py-0.5 rounded">{key}</span>
                      <span className="text-xs text-gray-400">{specialData[key] ? "已涉及" : "未涉及"}</span>
                    </div>
                    <p className="text-sm text-gray-700 mt-0.5">{specialData[key] || "设计说明中未提及该专项"}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="flex-1 min-w-0 space-y-6">
          <div>
            <h3 className="text-base font-semibold text-gray-900 mb-4">规范清单</h3>
            <div className="space-y-3">
              {displayRegulations.map((reg, idx) => (
                <div key={idx} className="bg-white rounded-lg border border-gray-200 p-4 hover:shadow-sm transition-shadow">
                  <div className="flex items-start gap-3">
                    <span className="text-xs font-mono text-blue-600 bg-blue-50 px-2 py-0.5 rounded shrink-0 mt-0.5">{reg.code_number}</span>
                    <div>
                      <p className="text-sm font-medium text-gray-900">{reg.code_name}</p>
                      {reg.reason && <p className="text-xs text-gray-500 mt-1">{reg.reason}</p>}
                    </div>
                  </div>
                </div>
              ))}
            </div>
            {regulations.length > 5 && (
              <button onClick={() => setShowAllRegulations(!showAllRegulations)} className="mt-3 text-sm text-blue-600 hover:text-blue-700 font-medium">
                {showAllRegulations ? "收起" : "查看更多（共" + regulations.length + "条）"}
              </button>
            )}
          </div>

          <div>
            <h3 className="text-base font-semibold text-gray-900 mb-4">历史高频问题</h3>
            <div className="space-y-3">
              {topIssues.map((issue, idx) => (
                <div key={idx} className="bg-white rounded-lg border border-gray-200 p-4 hover:shadow-sm transition-shadow">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-xs font-medium text-orange-600 bg-orange-50 px-2 py-0.5 rounded">高频 #{idx + 1}</span>
                    <span className="text-xs text-gray-400">出现 {issue.frequency} 次</span>
                  </div>
                  <p className="text-sm font-medium text-gray-900 mb-2">{issue.issue_summary}</p>
                  <div className="bg-gray-50 rounded-lg p-3 space-y-2">
                    <p className="text-xs text-gray-500"><span className="font-medium">问题描述：</span>{issue.sample_description}</p>
                    <p className="text-xs text-gray-500"><span className="font-medium">规范要求：</span>{issue.sample_requirement}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="flex gap-4 pt-4 border-t border-gray-100">
            <Button className="flex-1 h-11 bg-blue-600 hover:bg-blue-700 text-white"
              onClick={() => {
                const content = generateDownloadContent(projectData, specialData, reviewResult);
                const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
                const url = URL.createObjectURL(blob);
                const a = document.createElement("a");
                a.href = url;
                a.download = "审图清单_" + (projectData["项目名称"] || "未命名项目") + ".txt";
                a.click();
                URL.revokeObjectURL(url);
              }}>
              点击下载
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {projectKeys.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-gray-900 mb-3">项目信息</h3>
          <div className="grid grid-cols-2 gap-4">
            {projectKeys.map((key) => (
              <div key={key} className="bg-gray-50 rounded-lg p-3">
                <p className="text-xs text-gray-500 mb-1">{key}</p>
                <input className="w-full text-sm border border-gray-200 rounded px-2 py-1 focus:outline-none focus:border-blue-500"
                  value={projectData[key] || ""} placeholder="未提取到"
                  onChange={(e) => handleInfoChange("project_info", key, e.target.value)} />
              </div>
            ))}
          </div>
        </div>
      )}
      {specialKeys.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-gray-900 mb-3">专项设计信息</h3>
          <div className="space-y-3">
            {specialKeys.map((key) => (
              <div key={key} className="bg-gray-50 rounded-lg p-3">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs font-medium text-blue-600 bg-blue-50 px-2 py-0.5 rounded">{key}</span>
                  <span className="text-xs text-gray-400">{specialData[key] ? "已涉及" : "未涉及"}</span>
                </div>
                <input className="w-full text-sm border border-gray-200 rounded px-2 py-1 focus:outline-none focus:border-blue-500"
                  value={specialData[key] || ""} placeholder="设计说明中未提及该专项"
                  onChange={(e) => handleInfoChange("special_designs", key, e.target.value)} />
              </div>
            ))}
          </div>
        </div>
      )}
      <div className="flex gap-4 pt-4 border-t border-gray-100">
        <Button onClick={handleConfirmGenerate} disabled={generating} className="flex-1 h-11 bg-blue-600 hover:bg-blue-700 text-white">
          {generating ? "生成中..." : "确认生成"}
        </Button>
        <Button disabled variant="outline" className="flex-1 h-11 text-blue-600 border-blue-600 hover:bg-blue-50">点击下载</Button>
      </div>
    </div>
  );
}

function generateDownloadContent(projectData, specialData, reviewResult) {
  const lines = [];
  lines.push("===== 审图清单 =====");
  lines.push("");
  lines.push("--- 项目信息 ---");
  for (const [key, val] of Object.entries(projectData)) {
    lines.push(key + ": " + (val || "未提取到"));
  }
  lines.push("");
  lines.push("--- 专项设计信息 ---");
  for (const [key, val] of Object.entries(specialData)) {
    lines.push(key + ": " + (val || "未涉及"));
  }
  lines.push("");
  lines.push("--- 规范清单 ---");
  if (reviewResult?.regulations) {
    for (const reg of reviewResult.regulations) {
      lines.push(reg.code_number + " " + reg.code_name);
      if (reg.reason) lines.push("  理由: " + reg.reason);
    }
  }
  lines.push("");
  lines.push("--- 历史高频问题 ---");
  if (reviewResult?.top_issues) {
    for (const issue of reviewResult.top_issues) {
      lines.push("问题: " + issue.issue_summary + "（出现" + issue.frequency + "次）");
      lines.push("  描述: " + issue.sample_description);
      lines.push("  规范: " + issue.sample_requirement);
    }
  }
  lines.push("");
  lines.push("生成时间: " + new Date().toLocaleString());
  return lines.join("\\n");
}

export default function ProjectsPage() {
  return (
    <Suspense fallback={<div className="text-center py-20 text-gray-500">加载中...</div>}>
      <ProjectsPageContent />
    </Suspense>
  );
}
`;

const outPath = path.join("D:\\codex-project\\shenxiaozu-demo\\src\\app\\(dashboard)\\projects\\page.tsx");
fs.writeFileSync(outPath, content, "utf-8");
console.log("page.tsx written successfully");