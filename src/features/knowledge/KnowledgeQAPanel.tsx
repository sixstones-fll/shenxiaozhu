"use client";

import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { MessageSquare, Send } from "lucide-react";
import type { Message } from "./types";
import { sendChat, sendFollowUp } from "./api";

export default function KnowledgeQAPanel({ projectId }: { projectId: string }) {
  const storageKey = `kqa_msgs_${projectId}`;
  const [messages, setMessages] = useState<Message[]>(() => {
    try { const saved = sessionStorage.getItem(storageKey); return saved ? JSON.parse(saved) : []; }
    catch { return []; }
  });
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [showFollowUp, setShowFollowUp] = useState(false);
  const [lastExpertQuestion, setLastExpertQuestion] = useState("");
  const [detailPanel, setDetailPanel] = useState<{ type: string; data: any } | null>(null);
  const [copiedScript, setCopiedScript] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    try { sessionStorage.setItem(storageKey, JSON.stringify(messages)); }
    catch {}
  }, [messages, storageKey]);

  const handleSend = async () => {
    if (!input.trim() || loading) return;
    const userMsg: Message = { role: "user", content: input.trim(), isFollowUp: false };
    setMessages((prev) => [...prev, userMsg]);
    const q = input.trim();
    setInput("");
    setLoading(true);
    setShowFollowUp(false);

    try {
      const json = await sendChat(q);
      if (json.success) {
        const assistantMsg: Message = {
          role: "assistant",
          content: json.data || json.type || "",
          type: json.type,
          detail: json.detail || null,
        };
        setMessages((prev) => [...prev, assistantMsg]);
        if (json.type === "expert_match" && json.askFollowUp) {
          setShowFollowUp(true);
          setLastExpertQuestion(q);
        }
      } else {
        setMessages((prev) => [...prev, { role: "assistant", content: "服务暂不可用，请稍后重试", type: "code_query" }]);
      }
    } catch (e) {
      setMessages((prev) => [...prev, { role: "assistant", content: "网络错误，请稍后重试", type: "code_query" }]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleFollowUpYes = async () => {
    if (!lastExpertQuestion || loading) return;
    setShowFollowUp(false);
    setLoading(true);
    try {
      const json = await sendFollowUp(lastExpertQuestion);
      if (json.success) {
        setMessages((prev) => [
          ...prev,
          { role: "assistant", content: json.data || "", type: "code_query", detail: json.detail || null },
        ]);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleFollowUpNo = () => {
    setShowFollowUp(false);
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto space-y-4 mb-4 min-h-[300px]">
        {messages.length === 0 && (
          <div className="text-center text-gray-400 py-12">
            <MessageSquare className="w-12 h-12 mx-auto mb-3 text-gray-300" />
            <p className="text-sm">输入问题开始查询，支持规范查询和专家匹配</p>
          </div>
        )}
        {messages.map((msg, i) => (
          <div key={i} className={ lex }>
            <div
              className={`max-w-[80%] rounded-xl px-4 py-3 ${msg.role === "user" ? "bg-blue-600 text-white" : "bg-gray-50 border border-gray-200 text-gray-800"}`}
            >
              <div className="text-sm whitespace-pre-wrap">{msg.content}</div>
              {msg.role === "assistant" && msg.detail && (
                <button
                  onClick={() => setDetailPanel(msg.detail)}
                  className="mt-2 text-xs text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1"
                >
                  查看详情 →
                </button>
              )}
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex justify-start">
            <div className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-3">
              <div className="flex gap-1">
                <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" />
                <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "0.1s" }} />
                <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "0.2s" }} />
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />

        {showFollowUp && (
          <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-xl border border-blue-100">
            <span className="text-sm text-gray-700">是否需要查询相关规范？</span>
            <button
              onClick={handleFollowUpYes}
              disabled={loading}
              className="px-4 py-1.5 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              需要
            </button>
            <button
              onClick={handleFollowUpNo}
              disabled={loading}
              className="px-4 py-1.5 text-sm border border-gray-300 text-gray-600 rounded-lg hover:bg-gray-50 disabled:opacity-50"
            >
              不需要
            </button>
          </div>
        )}
      </div>

      <div className="border border-gray-200 rounded-xl bg-white p-2 flex items-end gap-2">
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="请输入问题，自动识别规范查询或专家匹配..."
          className="flex-1 resize-none border-0 outline-none text-sm py-2 px-3 max-h-32"
          rows={1}
        />
        <Button
          onClick={handleSend}
          disabled={loading || !input.trim()}
          className="bg-blue-600 hover:bg-blue-700 text-white shrink-0 h-9 px-4"
        >
          <Send className="w-4 h-4" />
        </Button>
      </div>

      {detailPanel && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div className="absolute inset-0 bg-black/20" onClick={() => setDetailPanel(null)} />
          <div className="relative w-96 bg-white shadow-2xl h-full overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between">
              <h3 className="text-sm font-semibold text-gray-800">
                {detailPanel.type === "code_query" ? "规范详情" : "专家详情"}
              </h3>
              <button onClick={() => setDetailPanel(null)} className="text-gray-400 hover:text-gray-600">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            <div className="p-4 space-y-4">
              {detailPanel.type === "code_query" && detailPanel.rules?.map((rule: any, i: number) => (
                <div key={i} className="border border-gray-200 rounded-xl p-4 bg-white">
                  <div className="flex items-start gap-2 mb-2">
                    <span className="text-xs font-medium text-blue-600 bg-blue-50 px-2 py-0.5 rounded shrink-0">规范 {i+1}</span>
                  </div>
                  <p className="text-sm font-semibold text-gray-900 mb-1">{rule.codeName}</p>
                  <p className="text-xs text-blue-600 mb-2">{rule.codeId}</p>
                  <p className="text-sm text-gray-700 font-medium mb-1">{rule.requirement}</p>
                  <p className="text-xs text-gray-500">{rule.detail}</p>
                  {rule.tips && (
                    <div className="mt-2 pt-2 border-t border-gray-100">
                      <p className="text-xs font-medium text-amber-700 mb-0.5">⚠️ 要点解读</p>
                      <p className="text-xs text-amber-600">{rule.tips}</p>
                    </div>
                  )}
                </div>
              ))}
              {detailPanel.type === "expert_match" && detailPanel.experts?.map((expert: any, i: number) => (
                <div key={i} className="border border-gray-200 rounded-xl p-4 bg-white">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-medium text-green-600 bg-green-50 px-2 py-0.5 rounded">
                      {expert.role || "专家 " + (i+1)}
                    </span>
                    {expert.phone && (
                      <div className="flex items-center gap-1.5">
                        {expert.isWechat && (
                          <svg className="w-4 h-4 text-green-500" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M8.691 2.188C3.891 2.188 0 5.476 0 9.53c0 2.212 1.17 4.203 3.002 5.55a.59.59 0 0 1 .213.665l-.39 1.48c-.019.07-.048.141-.048.213 0 .163.13.295.29.295a.326.326 0 0 0 .167-.054l1.903-1.114a.864.864 0 0 1 .717-.098 10.16 10.16 0 0 0 2.837.403c.276 0 .543-.027.811-.05-.857-2.578.157-4.972 1.932-6.446 1.703-1.415 3.882-1.98 5.853-1.838-.576-3.583-4.196-6.348-8.596-6.348zM5.785 5.991c.642 0 1.162.529 1.162 1.18a1.17 1.17 0 0 1-1.162 1.178A1.17 1.17 0 0 1 4.623 7.17c0-.651.52-1.18 1.162-1.18zm5.813 0c.642 0 1.162.529 1.162 1.18a1.17 1.17 0 0 1-1.162 1.178 1.17 1.17 0 0 1-1.162-1.178c0-.651.52-1.18 1.162-1.18zm5.34 2.867c-1.797-.052-3.746.512-5.28 1.786-1.72 1.428-2.687 3.72-1.78 6.22.942 2.453 3.666 4.229 6.884 4.229.826 0 1.622-.12 2.361-.336a.722.722 0 0 1 .598.082l1.584.926a.272.272 0 0 0 .14.045.246.246 0 0 0 .242-.245c0-.06-.024-.12-.04-.178l-.325-1.233a.492.492 0 0 1 .178-.553C23.028 18.333 24 16.592 24 14.628c0-3.299-3.063-5.77-7.062-5.77zm-2.18 2.104c.535 0 .969.44.969.982a.976.976 0 0 1-.969.983.976.976 0 0 1-.969-.983c0-.542.434-.982.97-.982zm4.844 0c.535 0 .969.44.969.982a.976.976 0 0 1-.969.983.976.976 0 0 1-.969-.983c0-.542.434-.982.97-.982z"/>
                          </svg>
                        )}
                        <span className="text-xs text-gray-400">{expert.phone}</span>
                      </div>
                    )}
                  </div>
                  <p className="text-sm font-semibold text-gray-900 mb-1">
                    {expert.name}
                    {expert.title && <span className="text-xs text-gray-500 font-normal ml-1">({expert.title})</span>}
                  </p>
                  {expert.project && (
                    <p className="text-xs text-gray-500 mb-1">项目：{expert.project}</p>
                  )}
                  {expert.problem && (
                    <p className="text-xs text-gray-600 bg-gray-50 rounded-lg p-2 mt-1">
                      相关问题：{expert.problem}
                    </p>
                  )}
                  {expert.script && (
                    <div className="mt-2 pt-2 border-t border-gray-100">
                      <div className="flex items-start justify-between gap-2">
                        <p className="text-xs text-gray-700 leading-relaxed whitespace-pre-wrap flex-1">{expert.script}</p>
                        <button
                          onClick={() => {
                            navigator.clipboard.writeText(expert.script);
                            setCopiedScript(expert.script);
                            setTimeout(() => setCopiedScript(""), 2000);
                          }}
                          className="shrink-0 text-blue-500 hover:text-blue-700 mt-0.5"
                          title="复制话术"
                        >
                          {copiedScript === expert.script ? (
                            <span className="text-xs text-green-600 font-medium whitespace-nowrap">已复制</span>
                          ) : (
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
                            </svg>
                          )}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
              {(!detailPanel.rules?.length && !detailPanel.experts?.length) && (
                <p className="text-sm text-gray-400 text-center py-8">暂无结构化详情数据</p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}