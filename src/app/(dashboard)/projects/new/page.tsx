"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CloudUpload, X } from "lucide-react";
import { isDocxFile } from "@/lib/docx-parser";

export default function NewProjectPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [loading, setLoading] = useState(false);
  const [extracting, setExtracting] = useState(false);
  const [extractError, setExtractError] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const extractProjectName = async (selectedFile: File) => {
    if (!isDocxFile(selectedFile.name)) return;
    setExtracting(true);
    setExtractError("");
    try {
      const formData = new FormData();
      formData.append("file", selectedFile);
      const res = await fetch("/api/extract-preview", {
        method: "POST",
        body: formData,
      });
      const json = await res.json();
      if (json.success && json.data?.project_name) {
        if (!name.trim()) {
          setName(json.data.project_name);
        }
      }
    } catch (err) {
      console.error("项目名称预提取失败", err);
      setExtractError("项目名称识别失败，请手动填写");
    } finally {
      setExtracting(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (selected) {
      setFile(selected);
      extractProjectName(selected);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const selected = e.dataTransfer.files?.[0];
    if (selected) {
      setFile(selected);
      extractProjectName(selected);
    }
  };

  const createProject = async (withFile: boolean) => {
    if (!name.trim()) {
      alert("请输入项目名称");
      return;
    }

    if (withFile && !file) {
      alert('请先上传文件或选择"暂不上传"');
      return;
    }

    setLoading(true);
    try {
      const formData = new FormData();
      formData.append("name", name);
      if (withFile && file) formData.append("file", file);

      const res = await fetch("/api/projects", {
        method: "POST",
        body: formData,
      });
      const json = await res.json();
      if (!json.success) {
        alert(json.error || "创建项目失败");
        return;
      }
      const projectData = json.data;
      // 缓存项目数据避免重新查询
      if (projectData.project_info || projectData.project_name) {
        try {
          sessionStorage.setItem(`project_${projectData.project_id}`, JSON.stringify({
            name: projectData.project_name,
            project_info: projectData.project_info
          }));
        } catch(e) {}
      }
            sessionStorage.setItem("last_project", JSON.stringify({ id: projectData.project_id, tab: "review" }));
      router.push(`/projects?id=${projectData.project_id}&tab=review`);
      router.refresh();
    } catch (e) {
      alert("创建项目失败，请稍后重试");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-6">
        <h1 className="text-xl font-bold text-gray-900">新建项目</h1>
        <p className="text-sm text-gray-500 mt-1">填写项目信息并上传设计文件</p>
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          createProject(true);
        }}
        className="space-y-6"
      >
        <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-5">
          <div className="space-y-2">
            <Label htmlFor="name">项目名称</Label>
            <Input
              id="name"
              placeholder="例如：XX商业综合体施工图审查"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div
            onClick={() => fileInputRef.current?.click()}
            onDrop={handleDrop}
            onDragOver={(e) => {
              e.preventDefault();
              setIsDragging(true);
            }}
            onDragLeave={() => setIsDragging(false)}
            className={`border-2 border-dashed rounded-lg p-12 text-center cursor-pointer transition-colors ${
              isDragging
                ? "border-blue-500 bg-blue-50"
                : "border-gray-200 hover:border-blue-300"
            }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              className="hidden"
              accept=".pdf,.docx,.doc,.txt"
              onChange={handleFileChange}
            />
            <CloudUpload className="w-12 h-12 text-blue-600 mx-auto mb-3" />
            <p className="text-sm text-gray-600">点击或拖拽上传项目设计说明</p>
            <p className="text-xs text-gray-400 mt-1">支持 PDF、DOCX、DOC、TXT 格式</p>
            <p className="text-xs text-gray-400 mt-1">单个文件不超过 50MB</p>
          </div>

          {file && (
            <div className="mt-4 space-y-2">
              <div className="flex items-center justify-between bg-gray-50 rounded-lg px-4 py-2">
                <span className="text-sm text-gray-700">{file.name}</span>
                <button
                  type="button"
                  onClick={() => setFile(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              {extracting && (
                <p className="text-xs text-blue-600">正在识别项目名称...</p>
              )}
              {extractError && (
                <p className="text-xs text-red-500">{extractError}</p>
              )}
            </div>
          )}
        </div>

        <div className="space-y-3">
          <Button
            type="submit"
            disabled={loading}
            className="w-full h-11 bg-blue-600 hover:bg-blue-700 text-white"
          >
            {loading ? "提交中..." : "确认提交"}
          </Button>

          <Button
            type="button"
            variant="ghost"
            disabled={loading}
            onClick={() => createProject(false)}
            className="w-full text-gray-500 hover:text-gray-700"
          >
            暂不上传，直接开启新项目
          </Button>
        </div>
      </form>
    </div>
  );
}



