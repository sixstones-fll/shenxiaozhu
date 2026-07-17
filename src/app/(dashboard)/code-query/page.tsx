"use client";

import { Search, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function CodeQueryPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-gray-900">规范查询</h1>
        <p className="text-sm text-gray-500 mt-1">对话式检索规范条文</p>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 flex flex-col" style={{ height: "calc(100vh - 240px)" }}>
        {/* 聊天区域 */}
        <div className="flex-1 flex flex-col items-center justify-center px-6">
          <Search className="w-12 h-12 text-gray-200 mb-4" />
          <p className="text-gray-500 text-sm mb-2">输入您的问题，查询相关规范条文</p>
          <p className="text-gray-400 text-xs">
            例如：高层建筑防火分区要求有哪些？
          </p>
        </div>

        {/* 输入区 */}
        <div className="border-t border-gray-100 p-4">
          <div className="flex gap-2">
            <Input placeholder="请输入规范查询问题..." className="flex-1" />
            <Button className="bg-blue-600 hover:bg-blue-700 text-white shrink-0">
              <Send className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
