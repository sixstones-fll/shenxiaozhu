// features/review/types.ts
export interface ProjectInfo {
  ["项目名称"]?: string;
  ["项目编号"]?: string;
  ["建筑类型"]?: string;
  ["高度分类"]?: string;
  ["防火分类"]?: string;
  ["结构形式"]?: string;
  ["抗震设防烈度"]?: string;
  ["审图专业"]?: string;
  [key: string]: string | undefined;
}

export interface SpecialDesigns {
  ["人防"]?: string;
  ["绿建"]?: string;
  ["消防"]?: string;
  ["无障碍"]?: string;
  ["装配式"]?: string;
  ["BIM"]?: string;
  ["抗震支架"]?: string;
  ["海绵城市"]?: string;
  [key: string]: string | undefined;
}

export interface EditableReviewInfo {
  project_info: ProjectInfo;
  special_designs: SpecialDesigns;
}

export interface Regulation {
  codeNumber?: string;
  codeName?: string;
  code_number?: string;
  code_name?: string;
  codeId?: string;
  code_id?: string;
  reason?: string;
  detail?: string;
}

export interface TopIssue {
  summary?: string;
  frequency?: number;
  sample_requirement?: string;
}

export interface ReviewResult {
  regulations: Regulation[];
  top_issues?: TopIssue[];
  topIssues?: TopIssue[];
}

export interface ReviewGenerateResponse {
  success: boolean;
  data?: ReviewResult;
  error?: string;
}
