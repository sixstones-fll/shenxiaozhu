// expert-match.ts - 专家匹配逻辑
async function sbQuery(table, select, eqCol, eqVal) {
  const sbUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
  const sbKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";
  if (!sbUrl || !sbKey) return null;
  let url = sbUrl + "/rest/v1/" + table + "?select=" + encodeURIComponent(select);
  if (eqCol && eqVal) url += "&" + eqCol + "=eq." + encodeURIComponent(eqVal);
  url += "&limit=55";
  try {
    const r = await fetch(url, { headers: { apikey: sbKey, Authorization: "Bearer " + sbKey } });
    if (!r.ok) return null;
    return await r.json();
  } catch (e) { return null; }
}

async function extractQueryInfo(question) {
  const ep = process.env.DEEPSEEK_API_ENDPOINT || "https://api.deepseek.com";
  const key = process.env.DEEPSEEK_API_KEY || "";
  const model = process.env.DEEPSEEK_MODEL || "deepseek-v4-flash";
  try {
    const r = await fetch(ep + "/v1/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", "Authorization": "Bearer " + key },
      body: JSON.stringify({ model, messages: [{ role: "system", content: "从用户问题中提取两个信息：1. 专业类别：只能是建筑专业或结构专业。2. 关键词：提取核心问题描述（20字以内）。只返回JSON格式：{\"specialty\":\"建筑专业\",\"keywords\":\"关键词\"}" }, { role: "user", content: question }], temperature: 0, max_tokens: 100 }),
    });
    if (!r.ok) return { specialty: "建筑专业", keywords: question.substring(0, 20) };
    const d = await r.json();
    const parsed = JSON.parse(d.choices?.[0]?.message?.content || "{}");
    return { specialty: parsed.specialty || "建筑专业", keywords: parsed.keywords || question.substring(0, 20) };
  } catch (e) { return { specialty: "建筑专业", keywords: question.substring(0, 20) }; }
}

async function findMatchingIssue(specialty, fullQuestion) {
  const ep = process.env.DEEPSEEK_API_ENDPOINT || "https://api.deepseek.com";
  const key = process.env.DEEPSEEK_API_KEY || "";
  const model = process.env.DEEPSEEK_MODEL || "deepseek-v4-flash";
  const sheetName = specialty === "结构专业" ? "结构专业" : "建筑专业";
  const issues = await sbQuery("history_issues", "issue_description,designer,reviewer,project_name,building_type", "major", sheetName);
  if (!issues || issues.length === 0) return null;
  try {
    const listStr = issues.map((i, idx) => idx + ". " + i.issue_description).join("\n");
    const prompt = "历史问题列表（每行一个序号:描述）：\n" + listStr + "\n\n用户的问题：" + fullQuestion + "\n\n请找出最相似的历史问题，只返回序号（一个数字），如果不相似就返回-1。";
    const r = await fetch(ep + "/v1/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", "Authorization": "Bearer " + key },
      body: JSON.stringify({ model, messages: [{ role: "user", content: prompt }], temperature: 0, max_tokens: 200 }),
    });
    if (!r.ok) return null;
    const d = await r.json();
    const idx = parseInt((d.choices?.[0]?.message?.content || "-1").trim());
    if (idx >= 0 && idx < issues.length) {
      const m = issues[idx];
      return { problem: m.issue_description, designer: m.designer, reviewer: m.reviewer, project: m.project_name, buildingType: m.building_type };
    }
    return null;
  } catch (e) { return null; }
}

async function findEmployee(name, specialty) {
  if (!name) return null;
  const sheetName = specialty === "结构专业" ? "结构专业员工联系方式" : "建筑专业员工联系方式";
  const emps = await sbQuery("employee_contacts", "name,title,phone", "specialty_sheet", sheetName);
  if (!emps) return null;
  const m = emps.find(e => name.includes(e.name) || e.name.includes(name));
  return m ? { name: m.name, title: m.title, phone: String(m.phone) } : null;
}

function buildExpertDetail(match, di, ri, outputText) {
  const experts = [];
  let scripts = {};
  if (outputText) {
    const blocks = outputText.split("**推荐专家 ");
    for (let b = 1; b < blocks.length; b++) {
      const block = blocks[b];
      const num = parseInt(block.charAt(0));
      const scriptIdx = block.indexOf("**开场白 " + num);
      if (scriptIdx >= 0) {
        let script = block.substring(scriptIdx);
        const nextExpert = script.indexOf("**推荐专家");
        if (nextExpert >= 0) script = script.substring(0, nextExpert);
        scripts[num] = script.trim();
      }
    }
  }
  let en = 1;
  if (ri) { experts.push({ name: ri.name, title: ri.title, phone: ri.phone, isWechat: true, project: match.project, problem: match.problem, role: "图审人", script: scripts[en] || "" }); en++; }
  else if (match.reviewer) { experts.push({ name: match.reviewer, project: match.project, problem: match.problem, role: "图审人", script: "" }); }
  if (di) { experts.push({ name: di.name, title: di.title, phone: di.phone, isWechat: true, project: match.project, problem: match.problem, role: "设计人", script: scripts[en] || "" }); }
  else if (match.designer) { experts.push({ name: match.designer, project: match.project, problem: match.problem, role: "设计人", script: "" }); }
  return { type: "expert_match", experts };
}

async function generateRecommendation(match, di, ri) {
  const ep = process.env.DEEPSEEK_API_ENDPOINT || "https://api.deepseek.com";
  const key = process.env.DEEPSEEK_API_KEY || "";
  const model = process.env.DEEPSEEK_MODEL || "deepseek-v4-flash";
  let fullDesc = match.problem || "";
  let shortDesc = fullDesc;
  try {
    const r = await fetch(ep + "/v1/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", "Authorization": "Bearer " + key },
      body: JSON.stringify({ model, messages: [{ role: "system", content: "将以下问题描述转写成口语化的简短描述（10字以内）。只返回结果。" }, { role: "user", content: fullDesc }], temperature: 0, max_tokens: 50 }),
    });
    if (r.ok) { const d = await r.json(); shortDesc = d.choices?.[0]?.message?.content?.trim() || fullDesc; }
  } catch (e) {}
  const lines = [];
  if (ri) {
    lines.push("**推荐专家 1**：" + ri.name + "，" + ri.title + "，在" + match.project + "中处理过" + fullDesc + "问题，联系方式**" + ri.phone + "**。");
    lines.push("**开场白 1**：" + ri.name + "您好，我看到您在" + match.project + "中处理过\"" + shortDesc + "\"的问题，我目前在类似项目中遇到相关疑问，想向您请教，请问方便吗？");
  }
  if (di) {
    lines.push("**推荐专家 2**：" + di.name + "，" + di.title + "，在" + match.project + "中负责" + fullDesc + "设计相关问题，联系方式**" + di.phone + "**。");
    lines.push("**开场白 2**：" + di.name + "您好，我了解到您在" + match.project + "中负责\"" + shortDesc + "\"的设计工作，我现在在处理类似项目的设计问题，想请教您相关设计规范的应用，能否指导一下？");
  }
  return lines.join("\n\n");
}

export async function matchExperts(question) {
  try {
    const info = await extractQueryInfo(question);
    const match = await findMatchingIssue(info.specialty, question);
    if (!match) {
      return { success: true, type: "expert_match", data: "抱歉，还没有人处理过类似问题。请您提供具体的建筑项目施工图相关问题，以便为您进一步分析并推荐合适的专家。", askFollowUp: false, detail: null };
    }
    const [di, ri] = await Promise.all([findEmployee(match.designer, info.specialty), findEmployee(match.reviewer, info.specialty)]);
    const outputText = await generateRecommendation(match, di, ri);
    const detail = buildExpertDetail(match, di, ri, outputText);
    return { success: true, type: "expert_match", data: outputText, askFollowUp: true, detail };
  } catch (e) {
    console.error("[EX] error:", e);
    return { success: false, error: "服务暂不可用，请稍后重试" };
  }
}