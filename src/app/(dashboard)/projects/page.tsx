"use client";
import React, { Suspense, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useState } from "react";
import Link from "next/link";
import { PlusCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useProjectContext } from "@/lib/context/ProjectContext";
import ReviewPanel from "@/features/review/ReviewPanel";
import KnowledgeQAPanel from "@/features/knowledge/KnowledgeQAPanel";
import ReportPanel from "@/features/report/ReportPanel";
import ComparePanel from "@/features/compare/ComparePanel";
import IssueTrackingPanel from "@/features/issues/IssueTrackingPanel";

const tabs = [
  { key: "knowledge", label: "知识问答" },
  { key: "review", label: "审图规划" },
  { key: "report", label: "报告生成" },
  { key: "compare", label: "报告对比" },
  { key: "issues", label: "问题追踪" },
];

function ProjectsPageContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { state: ctxState, setProjectPage } = useProjectContext();
  const urlProjectId = searchParams.get("id");
  const urlTab = searchParams.get("tab");
  const [mounted, setMounted] = useState(false);
  const [projectId, setProjectId] = useState<string | null>(() => urlProjectId || ctxState.projectId);
  const [activeTab, setActiveTab] = useState(urlTab || ctxState.activeTab || "review");

  // 页面加载时：如果 URL 有项目，保存到 context 和 sessionStorage
  useEffect(() => {
    if (urlProjectId) {
      setProjectPage(urlProjectId, urlTab || activeTab);
      sessionStorage.setItem("last_project", JSON.stringify({ id: urlProjectId, tab: urlTab || activeTab }));
      setProjectId(urlProjectId);
    } else if (!projectId) {
      // URL 没有项目，尝试从 sessionStorage 恢复
      try {
        const saved = sessionStorage.getItem("last_project");
        if (saved) {
          const { id, tab } = JSON.parse(saved);
          if (id) {
            router.replace(`/projects?id=${id}&tab=${tab || "review"}`);
            return;
          }
        }
      } catch (e) {}
    }
  }, []);
  useEffect(() => { setMounted(true); }, []);

  // 切换 tab 时同步 URL 和 context
  const handleTabChange = (key: string) => {
    setActiveTab(key);
    if (projectId) {
      setProjectPage(projectId, key);
      const url = new URL(window.location.href);
      url.searchParams.set("tab", key);
      window.history.replaceState({}, "", url.toString());
    }
  };

  if (!mounted) return <div className="h-full" />;
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

  return (
    <div className="space-y-6 flex flex-col h-full">
      <div className="border-b border-gray-200">
        <nav className="flex gap-8">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => handleTabChange(tab.key)}
              className={activeTab === tab.key ? 'border-blue-600 text-blue-600 pb-3 text-sm font-medium border-b-2 transition-colors' : 'border-transparent text-gray-500 hover:text-gray-700 pb-3 text-sm font-medium border-b-2 transition-colors'}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>
      <div className="bg-white rounded-xl border border-gray-200 flex-1 flex flex-col min-h-0">
        <div key={activeTab} className="h-full">
          {activeTab === "review" && <ReviewPanel projectId={projectId} />}
          {activeTab === "knowledge" && <KnowledgeQAPanel projectId={projectId} />}
          {activeTab === "report" && <ReportPanel projectId={projectId} />}
          {activeTab === "compare" && <ComparePanel projectId={projectId} />}
          {activeTab === "issues" && <IssueTrackingPanel projectId={projectId} />}
        </div>
      </div>
    </div>
  );
}

export default function ProjectsPage() {
  return (
    <Suspense fallback={<div className="text-center py-20 text-gray-500">加载中...</div>}>
      <ProjectsPageContent />
    </Suspense>
  );
}