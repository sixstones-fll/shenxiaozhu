"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function ExpertMatchPage() {
  const router = useRouter();

  useEffect(() => {
    // 专家匹配已合并到知识问答功能
    router.replace("/projects?tab=knowledge");
  }, [router]);

  return (
    <div className="flex items-center justify-center h-64 text-gray-500">
      <p>正在跳转到知识问答...</p>
    </div>
  );
}
