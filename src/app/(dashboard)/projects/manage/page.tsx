"use client";

import { Settings } from "lucide-react";

export default function ManageProjectsPage() {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <Settings className="w-20 h-20 text-gray-200 mb-6" />
      <h1 className="text-2xl font-bold text-gray-900 mb-2">项目管理</h1>
      <p className="text-gray-500">管理项目信息和成员</p>
    </div>
  );
}
