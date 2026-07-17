// features/review/api.ts
import type { EditableReviewInfo, ReviewGenerateResponse } from "./types";

export async function generateReview(
  projectId: string,
  projectInfo: EditableReviewInfo
): Promise<ReviewGenerateResponse> {
  try {
    const res = await fetch("/api/review/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ projectId, projectInfo }),
    });
    return await res.json();
  } catch (e) {
    return { success: false, error: "网络错误" };
  }
}

export async function uploadAndExtract(
  projectId: string,
  file: File
): Promise<any> {
  const formData = new FormData();
  formData.append("name", "项目文件更新");
  formData.append("file", file);
  formData.append("project_id", projectId);
  const res = await fetch("/api/projects", { method: "POST", body: formData });
  return await res.json();
}
