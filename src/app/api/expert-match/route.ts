// @ts-nocheck
﻿import { NextRequest, NextResponse } from "next/server";

var EP = process.env.DEEPSEEK_API_ENDPOINT || "https://api.deepseek.com";
var KEY = process.env.DEEPSEEK_API_KEY || "";
var MODEL = process.env.DEEPSEEK_MODEL || "deepseek-v4-flash";
var SB_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
var SB_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";

export const maxDuration = 60;

async function sbQuery(table, select, eqCol, eqVal) {
  var url = SB_URL + "/rest/v1/" + table + "?select=" + encodeURIComponent(select);
  if (eqCol && eqVal) url += "&" + eqCol + "=eq." + encodeURIComponent(eqVal);
  url += "&limit=55";
  var r = await fetch(url, { headers: { apikey: SB_KEY, Authorization: "Bearer " + SB_KEY } });
  if (!r.ok) { var txt = await r.text(); console.error("[DB] supa error", r.status, txt); return null; }
  var data = await r.json();
  console.log("[DB] got", data.length, "records from", table);
  return data;
}

export async function POST(request) {
  try {
    var body = await request.json();
    var q = body.question;
    if (!q || typeof q !== "string" || q.trim().length === 0)
      return NextResponse.json({ success: false, error: "empty" }, { status: 400 });
    console.log("[EX] question:", q);
    var info = await extractQueryInfo(q.trim());
    console.log("[EX] info:", JSON.stringify(info));
    var match = await findMatchingIssue(info.specialty, q.trim());
    console.log("[EX] match:", match ? match.problem : "null");
    if (!match) {
      return NextResponse.json({ success: true, data: { output: "抱歉，还没有人处理过类似问题。请您提供具体的建筑项目施工图相关问题，以便我为您进一步分析并推荐合适的专家。" }, askFollowUp: false, detail: null });
    }
    var di = await findEmployee(match.designer, info.specialty);
    var ri = await findEmployee(match.reviewer, info.specialty);
    console.log("[EX] designer:", JSON.stringify(di), "reviewer:", JSON.stringify(ri));
    var output = await genRec(match, di, ri);
    var detail = buildExpertDetail(match, di, ri, output);
    return NextResponse.json({ success: true, data: { output }, askFollowUp: true, detail: detail });
  } catch (e) {
    console.error("[EX] error:", e);
    return NextResponse.json({ success: false, error: "unavailable" }, { status: 500 });
  }
}

function buildExpertDetail(match, di, ri, outputLines) {
  var experts = [];
  // 从 outputLines 中提取每个专家对应的开场白
  // outputLines 格式：
  // **推荐专家 1**：...
  // **开场白 1**：...
  // **推荐专家 2**：...
  // **开场白 2**：...
  var scriptsByExpert = {};
  if (outputLines) {
    // 按"推荐专家"分割，获取每个专家的段落
    var expertBlocks = outputLines.split("**推荐专家 ");
    for (var b = 1; b < expertBlocks.length; b++) {
      var block = expertBlocks[b].trim();
      // 提取专家序号（第一个字符）
      var expertNum = parseInt(block.charAt(0));
      // 检查是否有对应的开场白
      if (block.indexOf("**开场白 " + expertNum) >= 0) {
        var scriptStart = block.indexOf("**开场白 " + expertNum);
        var script = "**开场白 " + expertNum + block.substring(scriptStart + ("**开场白 " + expertNum).length);
        // 只取到下一个"推荐专家"之前
        var nextExpert = script.indexOf("**推荐专家");
        if (nextExpert >= 0) {
          script = script.substring(0, nextExpert);
        }
        scriptsByExpert[expertNum] = script.trim();
      }
    }
  }
  var expertNum = 1;
  if (ri) {
    experts.push({ name: ri.name, title: ri.title, phone: ri.phone, isWechat: true, project: match.project, problem: match.problem, role: "图审人", script: scriptsByExpert[expertNum] || "" });
    expertNum++;
  } else if (match.reviewer) {
    experts.push({ name: match.reviewer, project: match.project, problem: match.problem, role: "图审人", script: "" });
  }
  if (di) {
    experts.push({ name: di.name, title: di.title, phone: di.phone, isWechat: true, project: match.project, problem: match.problem, role: "设计人", script: scriptsByExpert[expertNum] || "" });
    expertNum++;
  } else if (match.designer) {
    experts.push({ name: match.designer, project: match.project, problem: match.problem, role: "设计人", script: "" });
  }
  return { type: "expert_match", experts: experts };
}

async function extractQueryInfo(question) {
  try {
    var r = await fetch(EP + "/v1/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", "Authorization": "Bearer " + KEY },
      body: JSON.stringify({ model: MODEL, messages: [{ role: "system", content: "从问题中提取：专业（建筑专业或结构专业）和关键词（20字以内）。返回JSON格式，包含specialty和keywords字段。" }, { role: "user", content: question }], temperature: 0, max_tokens: 200 }),
    });
    if (!r.ok) { console.error("[DS] extract error", r.status); return { specialty: "建筑专业", keywords: question.slice(0, 20) }; }
    var d = await r.json();
    var t = d.choices?.[0]?.message?.content || "{}";
    console.log("[DS] extract raw:", t);
    var p = JSON.parse(t);
    console.log("[DS] extract parsed:", JSON.stringify(p));
    return { specialty: p.specialty || "建筑专业", keywords: p.keywords || question.slice(0, 20) };
  } catch (e) {
    console.error("[DS] extract exception:", e);
    return { specialty: "建筑专业", keywords: question.slice(0, 20) };
  }
}

async function genRec(match, di, ri) {
  var fullDesc = match.problem;
  var shortDesc = fullDesc;
  try {
    var r = await fetch(EP + "/v1/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", "Authorization": "Bearer " + KEY },
      body: JSON.stringify({ model: MODEL, messages: [{ role: "system", content: "将以下施工图审查问题描述转成简短的、口语化的问题表述（20字以内）。只返回简短的问题描述，不要多余内容。" }, { role: "user", content: fullDesc }], temperature: 0, max_tokens: 200 }),
    });
    if (r.ok) {
      var d = await r.json();
      var t = d.choices?.[0]?.message?.content || fullDesc;
      shortDesc = t.trim();
      console.log("[DS] shortDesc:", shortDesc);
    }
  } catch (e) { console.error("[DS] shortDesc error:", e); }

  var o = [];
  if (ri) {
    o.push("**推荐专家 1**：" + ri.name + "，" + ri.title + "，在" + match.project + "中处理过" + fullDesc + "问题，联系方式**" + ri.phone + "**。");
    o.push("");
    o.push("**开场白 1**：" + ri.name + "您好，我看到您在" + match.project + "中处理过\"" + shortDesc + "\"的问题，我目前在类似项目中遇到相关疑问，想向您请教，请问方便吗？");
  } else if (match.reviewer) {
    o.push("**推荐专家 1**：" + match.reviewer + "，在" + match.project + "中处理过" + fullDesc + "问题。");
    o.push("");
    o.push("**开场白 1**：" + match.reviewer + "您好，我看到您在" + match.project + "中处理过\"" + shortDesc + "\"的问题，我目前在类似项目中遇到相关疑问，想向您请教，请问方便吗？");
  }
  if (di) {
    o.push("");
    o.push("**推荐专家 2**：" + di.name + "，" + di.title + "，在" + match.project + "中负责" + fullDesc + "设计相关问题，联系方式**" + di.phone + "**。");
    o.push("");
    o.push("**开场白 2**：" + di.name + "您好，我了解到您在" + match.project + "中负责\"" + shortDesc + "\"的设计工作，我现在在处理类似项目的设计问题，想请教您相关设计规范的应用，能否指导一下？");
  } else if (match.designer) {
    o.push("");
    o.push("**推荐专家 2**：" + match.designer + "，在" + match.project + "中负责" + fullDesc + "设计相关问题。");
    o.push("");
    o.push("**开场白 2**：" + match.designer + "您好，我了解到您在" + match.project + "中负责\"" + shortDesc + "\"的设计工作，我现在在处理类似项目的设计问题，想请教您相关设计规范的应用，能否指导一下？");
  }
  return o.join("\n");
}

async function findMatchingIssue(specialty, fullQuestion) {
  console.log("[MATCH] looking in", specialty, "for:", fullQuestion);
  var issues = await sbQuery("history_issues", "issue_description,designer,reviewer,project_name,building_type", "major", specialty);
  if (!issues || issues.length === 0) { console.error("[MATCH] no issues"); return null; }
  console.log("[MATCH] got", issues.length, "issues to match against");
  try {
    var listStr = issues.map(function(i, idx) { return idx + ". " + i.issue_description; }).join("\n");
    var prompt = "历史问题列表（每行一个序号+描述）：\n" + listStr + "\n\n用户的问题：" + fullQuestion + "\n\n请找出最相似的历史问题，只返回序号（一个数字），如果都不相似就返回-1。";
    var r = await fetch(EP + "/v1/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", "Authorization": "Bearer " + KEY },
      body: JSON.stringify({ model: MODEL, messages: [{ role: "user", content: prompt }], temperature: 0, max_tokens: 200 }),
    });
    if (!r.ok) { console.error("[MATCH] deepseek error", r.status); return null; }
    var d = await r.json();
    var content = d.choices?.[0]?.message?.content || "-1";
    console.log("[MATCH] deepseek response:", content);
    var idx = parseInt(content.trim());
    console.log("[MATCH] matched index:", idx);
    if (idx >= 0 && idx < issues.length) {
      var m = issues[idx];
      console.log("[MATCH] matched issue:", m.issue_description);
      return { problem: m.issue_description, designer: m.designer, reviewer: m.reviewer, project: m.project_name, buildingType: m.building_type };
    }
    return null;
  } catch (e) {
    console.error("[MATCH] exception:", e);
    return null;
  }
}

async function findEmployee(name, specialty) {
  if (!name) return null;
  var sheet = specialty === "结构专业" ? "结构专业员工联系方式" : "建筑专业员工联系方式";
  var emps = await sbQuery("employee_contacts", "name,title,phone", "specialty_sheet", sheet);
  if (!emps) return null;
  var m = emps.find(function(e) { return name.includes(e.name) || e.name.includes(name); });
  console.log("[EMP] looking for", name, "found:", m ? m.name : "null");
  if (m) return { name: m.name, title: m.title, phone: String(m.phone) };
  return null;
}
