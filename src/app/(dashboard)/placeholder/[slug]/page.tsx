"use client";

import { FileBarChart, GitCompare, BarChart3, Construction } from "lucide-react";

const placeholderPages = [
  { title: "报告生成", slug: "report", icon: FileBarChart, desc: "自动生成审图报告" },
  { title: "报告对比", slug: "compare", icon: GitCompare, desc: "对比不同版本的审图报告" },
  { title: "问题统计", slug: "statistics", icon: BarChart3, desc: "统计数据查看审图问题分布" },
];

export default function PlaceholderPage({ params }: { params: { slug: string } }) {
  const page = placeholderPages.find((p) => p.slug === params.slug) || {
    title: "功能开发中",
    slug: "",
    icon: Construction,
    desc: "",
  };

  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <page.icon className="w-20 h-20 text-gray-200 mb-6" />
      <h1 className="text-2xl font-bold text-gray-900 mb-2">{page.title}</h1>
      <p className="text-gray-500 mb-1">{page.desc}</p>
      <div className="mt-6 px-4 py-2 bg-blue-50 text-blue-600 rounded-lg text-sm font-medium">
        功能即将上线，敬请期待
      </div>
    </div>
  );
}
