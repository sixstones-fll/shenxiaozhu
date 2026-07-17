// expert-match.ts - 专家匹配逻辑（独立部署，不影响其他标签）

async function sbQuery(table, select, eqCol, eqVal) {
  const sbUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
  const sbKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";
  if (!sbUrl || !sbKey) return { error: "no_credentials" };
  let url = sbUrl + "/rest/v1/" + table + "?select=" + encodeURIComponent(select);
  if (eqCol && eqVal) url += "&" + eqCol + "=eq." + encodeURIComponent(eqVal);
  url += "&limit=55";
  try {
    const r = await fetch(url, { headers: { apikey: sbKey, Authorization: "Bearer " + sbKey } });
    if (!r.ok) return { error: "http_" + r.status };
    const data = await r.json();
    if (!Array.isArray(data) || data.length === 0) return { error: "empty" };
    return data;
  } catch (e) { return { error: "fetch_failed" }; }
}

async function callDeepSeek(messages, maxTokens = 200) {
  const ep = process.env.DEEPSEEK_API_ENDPOINT || "https://api.deepseek.com";
  const key = process.env.DEEPSEEK_API_KEY || "";
  const model = process.env.DEEPSEEK_MODEL || "deepseek-v4-flash";
  try {
    const r = await fetch(ep + "/v1/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", "Authorization": "Bearer " + key },
      body: JSON.stringify({ model, messages, temperature: 0, max_tokens: maxTokens }),
    });
    if (!r.ok) return { error: "http_" + r.status };
    const d = await r.json();
    if (!d.choices || !d.choices[0]) return { error: "no_choices", raw: JSON.stringify(d).substring(0, 200) };
    return { text: d.choices[0].message.content, raw: JSON.stringify(d).substring(0, 300) };
  } catch (e) { return { error: "fetch_failed", detail: e.message }; }
}

export async function matchExperts(question) {
  // 步骤1: 提取专业和关键词
  const qInfo = await callDeepSeek([
    { role: "system", content: "从用户问题中提取两个信息：1. 专业类别：只能是建筑专业或结构专业。2. 关键词：提取核心问题描述（20字以内）。只返回JSON格式：{\"specialty\":\"建筑专业\",\"keywords\":\"关键词\"}" },
    { role: "user", content: question }
  ], 100);
  if (qInfo.error) {
    return { success: true, type: "expert_match", data: "步骤1失败: " + qInfo.error + (qInfo.raw ? " " + qInfo.raw : ""), askFollowUp: false, detail: null };
  }
  let specialty = "建筑专业";
  let keywords = question.substring(0, 20);
  try {
    const parsed = JSON.parse(qInfo.text);
    specialty = parsed.specialty || "建筑专业";
    keywords = parsed.keywords || keywords;
  } catch (e) {}

  // 步骤2: 查历史问题库
  const sheetName = specialty === "结构专业" ? "结构专业" : "建筑专业";
  const issues = await sbQuery("history_issues", "issue_description,designer,reviewer,project_name,building_type", "major", sheetName);
  if (issues.error) {
    return { success: true, type: "expert_match", data: "步骤2失败: 查询历史问题库 " + issues.error, askFollowUp: false, detail: null };
  }

  // 步骤3: 语义匹配最相似问题
  const listStr = (issues as any[]).map((i, idx) => idx + ". " + i.issue_description).join("\n");
  const matchResult = await callDeepSeek([
    { role: "user", content: "历史问题列表（每行一个序号:描述）：\n" + listStr + "\n\n用户的问题：" + question + "\n\n请找出最相似的历史问题，只返回序号（一个数字），如果不相似就返回-1。" }
  ], 800);
  if (matchResult.error) {
    return { success: true, type: "expert_match", data: "步骤3失败: " + matchResult.error, askFollowUp: false, detail: null };
  }
  const idxText = matchResult.text.trim();
  const idx = parseInt(idxText);
  if (isNaN(idx) || idx < 0 || idx >= issues.length) {
    return { success: true, type: "expert_match", data: "步骤3: 未找到匹配（返回: " + idxText + "）, raw: " + (matchResult.raw || JSON.stringify(matchResult).substring(0, 200)), askFollowUp: false, detail: null };
  }
  const match = issues[idx];

  // 步骤4: 查员工联系方式
  const empSheet = specialty === "结构专业" ? "结构专业员工联系方式" : "建筑专业员工联系方式";
  const emps = await sbQuery("employee_contacts", "name,title,phone", "specialty_sheet", empSheet);
  const findEmp = (name) => {
    if (!name || !emps || emps.error) return null;
    return emps.find(e => name.includes(e.name) || e.name.includes(name)) || null;
  };
  const di = findEmp(match.designer);
  const ri = findEmp(match.reviewer);

  // 步骤5: 生成推荐话术
  const shortDescResult = await callDeepSeek([
    { role: "system", content: "将以下问题描述转写成口语化的简短描述（10字以内）。只返回结果。" },
    { role: "user", content: match.issue_description }
  ], 50);
  const shortDesc = shortDescResult.text?.trim() || match.issue_description;
  const fullDesc = match.issue_description;
  const lines = [];
  if (ri) {
    lines.push("**推荐专家 1**：" + ri.name + "，" + ri.title + "，在" + match.project_name + "中处理过" + fullDesc + "问题，联系方式**" + ri.phone + "**。");
    lines.push("**开场白 1**：" + ri.name + "您好，我看到您在" + match.project_name + "中处理过\"" + shortDesc + "\"的问题，我目前在类似项目中遇到相关疑问，想向您请教，请问方便吗？");
  }
  if (di) {
    lines.push("**推荐专家 2**：" + di.name + "，" + di.title + "，在" + match.project_name + "中负责" + fullDesc + "设计相关问题，联系方式**" + di.phone + "**。");
    lines.push("**开场白 2**：" + di.name + "您好，我了解到您在" + match.project_name + "中负责\"" + shortDesc + "\"的设计工作，我现在在处理类似项目的设计问题，想请教您相关设计规范的应用，能否指导一下？");
  }
  const outputText = lines.join("\n\n");

  // 构建详情
  const experts = [];
  const detail = {
    type: "expert_match",
    experts: [],
  };
  if (ri) {
    detail.experts.push({ name: ri.name, title: ri.title, phone: String(ri.phone), isWechat: true, project: match.project_name, problem: match.issue_description, role: "图审人", script: "开场白：" + ri.name + "您好，我看到您在" + match.project_name + "中处理过\"" + shortDesc + "\"的问题，我目前在类似项目中遇到相关疑问，想向您请教，请问方便吗？" });
  } else if (match.reviewer) {
    detail.experts.push({ name: match.reviewer, project: match.project_name, problem: match.issue_description, role: "图审人", script: "" });
  }
  if (di) {
    detail.experts.push({ name: di.name, title: di.title, phone: String(di.phone), isWechat: true, project: match.project_name, problem: match.issue_description, role: "设计人", script: "开场白：" + di.name + "您好，我了解到您在" + match.project_name + "中负责\"" + shortDesc + "\"的设计工作，我现在在处理类似项目的设计问题，想请教您相关设计规范的应用，能否指导一下？" });
  } else if (match.designer) {
    detail.experts.push({ name: match.designer, project: match.project_name, problem: match.issue_description, role: "设计人", script: "" });
  }

  return { success: true, type: "expert_match", data: outputText || "已找到相关专家", askFollowUp: true, detail: detail.experts.length > 0 ? detail : null };
}

