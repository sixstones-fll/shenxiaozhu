// features/knowledge/api.ts
import type { ChatResponse } from "./types";

export async function sendChat(question: string): Promise<ChatResponse> {
  try {
    const res = await fetch("/api/coze/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ question }),
    });
    return await res.json();
  } catch (e) {
    return { success: false, error: "网络错误" };
  }
}

export async function sendFollowUp(question: string): Promise<ChatResponse> {
  try {
    const res = await fetch("/api/coze/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ question, expertOnly: true }),
    });
    return await res.json();
  } catch (e) {
    return { success: false, error: "网络错误" };
  }
}
