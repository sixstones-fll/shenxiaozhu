"use client";

import { Upload, FileText } from "lucide-react";

export default function KbUploadPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-gray-900">知识库上传</h1>
        <p className="text-sm text-gray-500 mt-1">上传文件到知识库（管理员功能）</p>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="border-2 border-dashed border-gray-200 rounded-lg p-14 text-center hover:border-blue-300 transition-colors cursor-pointer">
          <Upload className="w-14 h-14 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500 text-sm mb-1">点击或拖拽文件上传</p>
          <p className="text-gray-400 text-xs">支持 PDF、DWG、DOCX 格式</p>
        </div>

        <div className="mt-6 space-y-3">
          <h3 className="font-semibold text-gray-900 text-sm">已上传文件</h3>
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <FileText className="w-10 h-10 text-gray-200 mb-2" />
            <p className="text-sm text-gray-500">暂无已上传的文件</p>
          </div>
        </div>
      </div>
    </div>
  );
}
