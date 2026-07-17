// @ts-nocheck
"use client";

import { Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { PlusCircle, CloudUpload, X, MessageSquare, BookOpen, Users, Send } from "lucide-react";
import { supabase } from "@/lib/supabase/client";

type Project = {
  id: string;
  name: string;
  description: string | null;
  created_at: string;
  project_info: any | null;
};

type Message = {
  role: "user" | "assistant";
  content: string;
  type?: "code_query" | "expert_match";
  isFollowUp?: boolean;
  detail?: any;
};

const tabs = [
  { key: "knowledge", label: "知识问答" },
  { key: "review", label: "审图规划" },
  { key: "report", label: "报告生成" },
  { key: "compare", label: "报告对比" },
  { key: "issues", label: "问题追踪" },
];

﻿function ReviewPanel({ projectInfo, projectId }) {
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
    if (reviewResult.regulations && reviewResult.regulations.length > 0) {
      const displayRegs = reviewResult.regulations.slice(0, 5);
      for (const reg of displayRegs) {
        contentLines.push("  " + reg.codeName + " " + (reg.codeId || ""));
        if (reg.detail) contentLines.push("    要求: " + reg.detail);
      }
      if (reviewResult.regulations.length > 5) {
        contentLines.push("  ...共" + reviewResult.regulations.length + "条规范");
      }
    }
    contentLines.push("");
    contentLines.push("--- 历史高频问题 ---");
    if (reviewResult.topIssues && reviewResult.topIssues.length > 0) {
      for (const issue of reviewResult.topIssues) {
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
    <div className="space-y-6">
      {/* 项目信息编辑区 */}
      <div className="bg-white border border-gray-200 rounded-xl p-6">
        <h3 className="text-base font-semibold text-gray-900 mb-4">项目信息</h3>
        <div className="grid grid-cols-2 gap-4">
          {projectInfoKeys.map((key) => (
            <div key={key}>
              <label className="text-xs text-gray-500 mb-1 block">{key}</label>
              <input
                type="text"
                value={editableInfo?.project_info?.[key] || ""}
                onChange={(e) => handleInfoChange("project_info", key, e.target.value)}
                placeholder="未提取到"
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-blue-400"
              />
            </div>
          ))}
        </div>
      </div>

      {/* 专项设计信息编辑区 */}
      <div className="bg-white border border-gray-200 rounded-xl p-6">
        <h3 className="text-base font-semibold text-gray-900 mb-4">专项设计信息</h3>
        <div className="grid grid-cols-2 gap-4">
          {specialDesignsKeys.map((key) => (
            <div key={key}>
              <label className="text-xs text-gray-500 mb-1 block">{key}</label>
              <input
                type="text"
                value={editableInfo?.special_designs?.[key] || ""}
                onChange={(e) => handleInfoChange("special_designs", key, e.target.value)}
                placeholder="设计说明中未提及该专项"
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-blue-400"
              />
            </div>
          ))}
        </div>
      </div>

      {/* 按钮区 */}
      <div className="flex gap-3">
        <Button
          onClick={handleConfirmGenerate}
          disabled={generating}
          className="bg-blue-600 hover:bg-blue-700 text-white"
        >
          {generating ? "生成中..." : "确认生成"}
        </Button>
        <Button
          onClick={handleDownload}
          disabled={!confirmed}
          className={"border border-gray-200 " + (confirmed ? "text-blue-600 hover:bg-blue-50" : "text-gray-400 cursor-not-allowed")}
        >
          点击下载
        </Button>
      </div>

      {/* 审图规划结果预览 */}
      {reviewResult && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
          {/* 规范清单 */}
          <div className="bg-white border border-gray-200 rounded-xl p-6">
            <h3 className="text-base font-semibold text-gray-900 mb-4">规范清单</h3>
            <div className="space-y-3">
              {(showAllRegulations ? reviewResult.regulations || [] : (reviewResult.regulations || []).slice(0, 5)).map((reg, idx) => (
                <div key={idx} className="border border-gray-100 rounded-lg p-3 bg-gray-50">
                  <p className="text-sm font-medium text-gray-900">{reg.codeName}</p>
                  {reg.codeId && <p className="text-xs text-blue-500 mt-0.5">{reg.codeId}</p>}
                  {reg.detail && <p className="text-xs text-gray-500 mt-1">规范要求：{reg.detail}</p>}
                </div>
              ))}
            </div>
            {reviewResult.regulations && reviewResult.regulations.length > 5 && (
              <button
                onClick={() => setShowAllRegulations(!showAllRegulations)}
                className="text-xs text-blue-600 hover:text-blue-700 mt-3"
              >
                {showAllRegulations ? "收起" : "查看更多（共" + reviewResult.regulations.length + "条）"}
              </button>
            )}
          </div>

          {/* 历史高频问题 */}
          <div className="bg-white border border-gray-200 rounded-xl p-6">
            <h3 className="text-base font-semibold text-gray-900 mb-4">历史高频问题</h3>
            <div className="space-y-3">
              {(reviewResult.topIssues || []).map((issue, idx) => (
                <div key={idx} className="border border-gray-100 rounded-lg p-3 bg-gray-50">
                  <p className="text-sm font-medium text-gray-900">
                    {"高频 #" + (idx + 1)}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">问题描述：{issue.summary}</p>
                  {issue.sample_requirement && (
                    <p className="text-xs text-gray-500 mt-0.5">规范要求：{issue.sample_requirement}</p>
                  )}
                  <p className="text-xs text-amber-600 mt-1">出现 {issue.frequency} 次</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
function KnowledgeQAPanel({ projectId }: { projectId: string }) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [showFollowUp, setShowFollowUp] = useState(false);
  const [lastExpertQuestion, setLastExpertQuestion] = useState("");
  const [detailPanel, setDetailPanel] = useState<{ type: string; data: any } | null>(null);
  const [copiedScript, setCopiedScript] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || loading) return;
    const userMsg: Message = { role: "user", content: input.trim(), isFollowUp: false };
    setMessages((prev) => [...prev, userMsg]);
    const q = input.trim();
    setInput("");
    setLoading(true);
    setShowFollowUp(false);

    try {
      const res = await fetch("/api/coze/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: q }),
      });
      const json = await res.json();
      if (json.success) {
        const assistantMsg: Message = {
          role: "assistant",
          content: json.data || json.type || "",
          type: json.type,
          detail: json.detail || null,
        };
        setMessages((prev) => [...prev, assistantMsg]);
        if (json.type === "expert_match" && json.askFollowUp) {
          setShowFollowUp(true);
          setLastExpertQuestion(q);
        }
      } else {
        setMessages((prev) => [...prev, { role: "assistant", content: "服务暂不可用，请稍后重试", type: "code_query" }]);
      }
    } catch (e) {
      setMessages((prev) => [...prev, { role: "assistant", content: "网络错误，请稍后重试", type: "code_query" }]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleFollowUpYes = async () => {
    if (!lastExpertQuestion || loading) return;
    setShowFollowUp(false);
    setLoading(true);
    try {
      const res = await fetch("/api/coze/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: lastExpertQuestion, expertOnly: true }),
      });
      const json = await res.json();
      if (json.success) {
        setMessages((prev) => [
          ...prev,
          { role: "assistant", content: json.data || "", type: "code_query", detail: json.detail || null },
        ]);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleFollowUpNo = () => {
    setShowFollowUp(false);
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto space-y-4 mb-4 min-h-[300px]">
        {messages.length === 0 && (
          <div className="text-center text-gray-400 py-12">
            <MessageSquare className="w-12 h-12 mx-auto mb-3 text-gray-300" />
            <p className="text-sm">输入问题开始查询，支持规范查询和专家匹配</p>
          </div>
        )}
        {messages.map((msg, i) => (
          <div key={i} className={lex }>
            <div
              className={`max-w-[80%] rounded-xl px-4 py-3 ${msg.role === "user" ? "bg-blue-600 text-white" : "bg-gray-50 border border-gray-200 text-gray-800"}`}
            >
              <div className="text-sm whitespace-pre-wrap">{msg.content}</div>
              {msg.role === "assistant" && msg.detail && (
                <button
                  onClick={() => setDetailPanel(msg.detail)}
                  className="mt-2 text-xs text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1"
                >
                  查看详情 →
                </button>
              )}
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex justify-start">
            <div className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-3">
              <div className="flex gap-1">
                <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" />
                <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "0.1s" }} />
                <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "0.2s" }} />
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />

        {showFollowUp && (
          <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-xl border border-blue-100">
            <span className="text-sm text-gray-700">是否需要查询相关规范？</span>
            <button
              onClick={handleFollowUpYes}
              disabled={loading}
              className="px-4 py-1.5 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              需要
            </button>
            <button
              onClick={handleFollowUpNo}
              disabled={loading}
              className="px-4 py-1.5 text-sm border border-gray-300 text-gray-600 rounded-lg hover:bg-gray-50 disabled:opacity-50"
            >
              不需要
            </button>
          </div>
        )}
      </div>

      <div className="border border-gray-200 rounded-xl bg-white p-2 flex items-end gap-2">
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="请输入问题，自动识别规范查询或专家匹配..."
          className="flex-1 resize-none border-0 outline-none text-sm py-2 px-3 max-h-32"
          rows={1}
        />
        <Button
          onClick={handleSend}
          disabled={loading || !input.trim()}
          className="bg-blue-600 hover:bg-blue-700 text-white shrink-0 h-9 px-4"
        >
          <Send className="w-4 h-4" />
        </Button>
      </div>

      {detailPanel && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div className="absolute inset-0 bg-black/20" onClick={() => setDetailPanel(null)} />
          <div className="relative w-96 bg-white shadow-2xl h-full overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between">
              <h3 className="text-sm font-semibold text-gray-800">
                {detailPanel.type === "code_query" ? "规范详情" : "专家详情"}
              </h3>
              <button onClick={() => setDetailPanel(null)} className="text-gray-400 hover:text-gray-600">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            <div className="p-4 space-y-4">
              {detailPanel.type === "code_query" && detailPanel.rules?.map((rule: any, i: number) => (
                <div key={i} className="border border-gray-200 rounded-xl p-4 bg-white">
                  <div className="flex items-start gap-2 mb-2">
                    <span className="text-xs font-medium text-blue-600 bg-blue-50 px-2 py-0.5 rounded shrink-0">规范 {i+1}</span>
                  </div>
                  <p className="text-sm font-semibold text-gray-900 mb-1">{rule.codeName}</p>
                  <p className="text-xs text-blue-600 mb-2">{rule.codeId}</p>
                  <p className="text-sm text-gray-700 font-medium mb-1">{rule.requirement}</p>
                  <p className="text-xs text-gray-500">{rule.detail}</p>
                  {rule.tips && (
                    <div className="mt-2 pt-2 border-t border-gray-100">
                      <p className="text-xs font-medium text-amber-700 mb-0.5">⚠️ 要点解读</p>
                      <p className="text-xs text-amber-600">{rule.tips}</p>
                    </div>
                  )}
                </div>
              ))}
              {detailPanel.type === "expert_match" && detailPanel.experts?.map((expert: any, i: number) => (
                <div key={i} className="border border-gray-200 rounded-xl p-4 bg-white">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-medium text-green-600 bg-green-50 px-2 py-0.5 rounded">
                      {expert.role || "专家 " + (i+1)}
                    </span>
                    {expert.phone && (
                      <div className="flex items-center gap-1.5">
                        {expert.isWechat && (
                          <svg className="w-4 h-4 text-green-500" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M8.691 2.188C3.891 2.188 0 5.476 0 9.53c0 2.212 1.17 4.203 3.002 5.55a.59.59 0 0 1 .213.665l-.39 1.48c-.019.07-.048.141-.048.213 0 .163.13.295.29.295a.326.326 0 0 0 .167-.054l1.903-1.114a.864.864 0 0 1 .717-.098 10.16 10.16 0 0 0 2.837.403c.276 0 .543-.027.811-.05-.857-2.578.157-4.972 1.932-6.446 1.703-1.415 3.882-1.98 5.853-1.838-.576-3.583-4.196-6.348-8.596-6.348zM5.785 5.991c.642 0 1.162.529 1.162 1.18a1.17 1.17 0 0 1-1.162 1.178A1.17 1.17 0 0 1 4.623 7.17c0-.651.52-1.18 1.162-1.18zm5.813 0c.642 0 1.162.529 1.162 1.18a1.17 1.17 0 0 1-1.162 1.178 1.17 1.17 0 0 1-1.162-1.178c0-.651.52-1.18 1.162-1.18zm5.34 2.867c-1.797-.052-3.746.512-5.28 1.786-1.72 1.428-2.687 3.72-1.78 6.22.942 2.453 3.666 4.229 6.884 4.229.826 0 1.622-.12 2.361-.336a.722.722 0 0 1 .598.082l1.584.926a.272.272 0 0 0 .14.045.246.246 0 0 0 .242-.245c0-.06-.024-.12-.04-.178l-.325-1.233a.492.492 0 0 1 .178-.553C23.028 18.333 24 16.592 24 14.628c0-3.299-3.063-5.77-7.062-5.77zm-2.18 2.104c.535 0 .969.44.969.982a.976.976 0 0 1-.969.983.976.976 0 0 1-.969-.983c0-.542.434-.982.97-.982zm4.844 0c.535 0 .969.44.969.982a.976.976 0 0 1-.969.983.976.976 0 0 1-.969-.983c0-.542.434-.982.97-.982z"/>
                          </svg>
                        )}
                        <span className="text-xs text-gray-400">{expert.phone}</span>
                      </div>
                    )}
                  </div>
                  <p className="text-sm font-semibold text-gray-900 mb-1">
                    {expert.name}
                    {expert.title && <span className="text-xs text-gray-500 font-normal ml-1">({expert.title})</span>}
                  </p>
                  {expert.project && (
                    <p className="text-xs text-gray-500 mb-1">项目：{expert.project}</p>
                  )}
                  {expert.problem && (
                    <p className="text-xs text-gray-600 bg-gray-50 rounded-lg p-2 mt-1">
                      相关问题：{expert.problem}
                    </p>
                  )}
                  {expert.script && (
                    <div className="mt-2 pt-2 border-t border-gray-100">
                      <div className="flex items-start justify-between gap-2">
                        <p className="text-xs text-gray-700 leading-relaxed whitespace-pre-wrap flex-1">{expert.script}</p>
                        <button
                          onClick={() => {
                            navigator.clipboard.writeText(expert.script);
                            setCopiedScript(expert.script);
                            setTimeout(() => setCopiedScript(""), 2000);
                          }}
                          className="shrink-0 text-blue-500 hover:text-blue-700 mt-0.5"
                          title="复制话术"
                        >
                          {copiedScript === expert.script ? (
                            <span className="text-xs text-green-600 font-medium whitespace-nowrap">已复制</span>
                          ) : (
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
                            </svg>
                          )}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
              {(!detailPanel.rules?.length && !detailPanel.experts?.length) && (
                <p className="text-sm text-gray-400 text-center py-8">暂无结构化详情数据</p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

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
        const cached = sessionStorage.getItem(`project_${projectId}`);
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
            sessionStorage.removeItem(`project_${projectId}`);
            setLoading(false);
            return;
          } catch (e) {}
        }
        const res = await fetch(`/api/project-item?id=${projectId}`);
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

  const handleTabChange = (key: string) => {
    setActiveTab(key);
    const params = new URLSearchParams(searchParams);
    params.set("tab", key);
    router.replace(`/projects?${params.toString()}`, { scroll: false });
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
    return (<div className="text-center py-20 text-gray-500">加载中...</div>);
  }

  const renderContent = () => {
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
                className={`pb-3 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === tab.key ? "border-blue-600 text-blue-600" : "border-transparent text-gray-500 hover:text-gray-700"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </nav>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-8 min-h-[300px]">
          {activeTab === "review" && <ReviewPanel projectInfo={project?.project_info} projectId={projectId || ""} />}
          {activeTab === "knowledge" && <KnowledgeQAPanel projectId={projectId || ""} />}
          {activeTab === "report" && (
            <div className="text-center text-gray-500">
              <p className="text-base font-medium mb-2">报告生成</p>
              <p className="text-sm">功能开发中...</p>
            </div>
          )}
          {activeTab === "compare" && (
            <div className="text-center text-gray-500">
              <p className="text-base font-medium mb-2">报告对比</p>
              <p className="text-sm">功能开发中...</p>
            </div>
          )}
          {activeTab === "issues" && (
            <div className="text-center text-gray-500">
              <p className="text-base font-medium mb-2">问题追踪</p>
              <p className="text-sm">功能开发中...</p>
            </div>
          )}
        </div>
      </div>
    );
  };

  return renderContent();
}
export default function ProjectsPage() {
  return (
    <Suspense fallback={<div className="text-center py-20 text-gray-500">加载中...</div>}>
      <ProjectsPageContent />
    </Suspense>
  );
}