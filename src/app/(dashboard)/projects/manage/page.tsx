"use client";

import ProjectManagePanel from "@/features/project-manage/ProjectManagePanel";

export default function ManageProjectsPage() {
  return (
    <div className="h-full flex flex-col">
      <div className="flex-1 min-h-0">
        <ProjectManagePanel />
      </div>
    </div>
  );
}
