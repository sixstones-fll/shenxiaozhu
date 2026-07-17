"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { useState } from "react";
import { PlusCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import ReviewPanel from "@/features/review/ReviewPanel";
import KnowledgeQAPanel from "@/features/knowledge/KnowledgeQAPanel";
import ReportPanel from "@/features/report/ReportPanel";

const tabs = [
  { key: "knowledge", label: "知识问答" },
  { key: "review", label: "审图规划" },
  { key: "report", label: "报告生成" },
  { key: "compare", label: "报告对比" },
  { key: "issues", label: "问题追踪" },
];

function ProjectsPageContent() {
  const searchParams = useSearchParams();
  const projectId = searchParams.get("id");
  const tabParam = searchParams.get("tab");
  const [activeTab, setActiveTab] = useState(tabParam || "review");

  const handleTabChange = (key: string) => {
    setActiveTab(key);
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

  return (
    <div className="space-y-6 flex flex-col h-full">
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
      <div className="bg-white rounded-xl border border-gray-200 flex-1 flex flex-col min-h-0">
        <div key={activeTab} className="h-full">
          {activeTab === "review" && <ReviewPanel projectId={projectId || ""} />}
          {activeTab === "knowledge" && <KnowledgeQAPanel projectId={projectId || ""} />}
          {activeTab === "report" && <ReportPanel projectId={projectId || ""} />}
          {activeTab === "compare" && (
            <div className="text-center text-gray-500 p-8">
              <p className="text-base font-medium mb-2">报告对比</p>
              <p className="text-sm">功能开发中...</p>
            </div>
          )}
          {activeTab === "issues" && (
            <div className="text-center text-gray-500 p-8">
              <p className="text-base font-medium mb-2">问题追踪</p>
              <p className="text-sm">功能开发中...</p>
            </div>
          )}
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
