// features/knowledge/types.ts
export interface Message {
  role: "user" | "assistant";
  content: string;
  type?: "code_query" | "expert_match";
  isFollowUp?: boolean;
  detail?: any;
}

export interface ChatResponse {
  success: boolean;
  type?: "code_query" | "expert_match";
  data?: string;
  askFollowUp?: boolean;
  detail?: any;
  error?: string;
}
