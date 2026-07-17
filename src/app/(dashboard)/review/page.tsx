"use client";

import { ClipboardList } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function ReviewPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-gray-900">审图规划</h1>
        <p className="text-sm text-gray-500 mt-1">生成和管理审查要点清单</p>
      </div>

      <div className="bg-white rounded-xl border border-gray-200">
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <ClipboardList className="w-16 h-16 text-gray-200 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-1">暂无审图规划</h3>
          <p className="text-sm text-gray-500 mb-6">
            请先选择项目，生成审图规划
          </p>
          <Button className="bg-blue-600 hover:bg-blue-700 text-white">
            选择项目
          </Button>
        </div>
      </div>
    </div>
  );
}
