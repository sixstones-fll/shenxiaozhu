"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { useState, useEffect } from "react";
import { PlusCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/lib/supabase/client";
import ReviewPanel from "@/components/review/ReviewPanel";
import KnowledgeQAPanel from "@/components/knowledge/KnowledgeQAPanel";

type Project = {
  id: string;
  name: string;
  description: string | null;
  created_at: string;
  project_info: any | null;
};

const tabs = [
  { key: "knowledge", label: "XX" },
  { key: "review", label: "????" },
  { key: "report", label: "????" },
  { key: "compare", label: "????" },
  { key: "issues", label: "????" },
];

function ProjectsPageContent() {
  const searchParams = useSearchParams();
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