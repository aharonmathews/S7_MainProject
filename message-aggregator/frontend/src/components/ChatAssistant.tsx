import React, { useState, useRef, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";

interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  sources?: Source[];
  timestamp: Date;
}

interface Source {
  platform: string;
  sender: string;
  title: string;
  timestamp: string;
  relevance_score: number;
  chat: string;
}

interface ChatAssistantProps {
  isIndexed: boolean;
  messageCount: number;
}

const PLATFORM_BADGE: Record<string, string> = {
  gmail:
    "bg-red-50    dark:bg-red-900/30    text-red-600    dark:text-red-400    border border-red-200    dark:border-red-800",
  telegram:
    "bg-sky-50    dark:bg-sky-900/30    text-sky-600    dark:text-sky-400    border border-sky-200    dark:border-sky-800",
  twitter:
    "bg-slate-100 dark:bg-slate-800     text-slate-700  dark:text-slate-300  border border-slate-200  dark:border-slate-700",
  reddit:
    "bg-orange-50 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400 border border-orange-200 dark:border-orange-800",
  slack:
    "bg-purple-50 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 border border-purple-200 dark:border-purple-800",
  discord:
    "bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800",
};

const PLATFORM_ICON: Record<string, string> = {
  gmail: "✉️",
  telegram: "✈️",
  twitter: "𝕏",
  reddit: "👾",
  slack: "💬",
  discord: "🎮",
};

const SUGGESTIONS = [
  "Any job interview emails?",
  "Latest project updates?",
  "Important deadlines?",
  "Any messages from my team?",
];

const ChatAssistant: React.FC<ChatAssistantProps> = ({
  isIndexed,
  messageCount,
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "welcome",
      role: "assistant",
      content:
        "👋 Hi! Load your messages first — then I can search across all your platforms and answer anything.",
      sources: [],
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const { getToken } = useAuth();

  useEffect(() => {
    setMessages([
      {
        id: isIndexed ? "ready" : "welcome",
        role: "assistant",
        content: isIndexed
          ? `✅ Ready! I have access to **${messageCount}** messages across your platforms.\n\nTry asking:\n• "Any job interview emails?"\n• "Latest updates from Slack?"\n• "Messages from [name]?"`
          : "👋 Hi! Load your messages first — then I can search across all your platforms and answer anything.",
        sources: [],
        timestamp: new Date(),
      },
    ]);
  }, [isIndexed, messageCount]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    if (isOpen) setTimeout(() => inputRef.current?.focus(), 100);
  }, [isOpen]);

  const handleQuery = async () => {
    if (!input.trim() || loading || !isIndexed) return;
    const q = input.trim();
    setMessages((p) => [
      ...p,
      {
        id: Date.now().toString(),
        role: "user",
        content: q,
        timestamp: new Date(),
      },
    ]);
    setInput("");
    setLoading(true);
    try {
      const token = await getToken();
      const res = await fetch("http://localhost:8000/api/rag/query", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ query: q }),
      });
      const data = await res.json();
      setMessages((p) => [
        ...p,
        {
          id: (Date.now() + 1).toString(),
          role: "assistant",
          content: data.answer,
          sources: data.sources || [],
          timestamp: new Date(),
        },
      ]);
    } catch {
      setMessages((p) => [
        ...p,
        {
          id: (Date.now() + 1).toString(),
          role: "assistant",
          content: "Something went wrong. Please try again.",
          sources: [],
          timestamp: new Date(),
        },
      ]);
    }
    setLoading(false);
  };

  return (
    <>
      {/* ── FAB ─────────────────────────────────────────────── */}
      <button
        onClick={() => setIsOpen((o) => !o)}
        className={`
          fixed bottom-6 right-6 w-13 h-13 rounded-2xl z-50
          flex items-center justify-center text-white text-xl font-bold
          shadow-2xl transition-all duration-200 hover:scale-110 active:scale-95
          ${
            isOpen
              ? "bg-slate-700 dark:bg-slate-800"
              : "bg-gradient-to-br from-violet-600 to-indigo-600 animate-pulse-ring"
          }
        `}
        style={{ width: 52, height: 52 }}
        title="AI Message Assistant"
      >
        {isOpen ? "✕" : "✦"}
      </button>

      {/* ── Chat Panel ──────────────────────────────────────── */}
      {isOpen && (
        <div
          className="
            fixed bottom-24 right-6 w-[400px] h-[560px] z-50
            flex flex-col rounded-2xl overflow-hidden
            shadow-2xl shadow-black/20 dark:shadow-black/60
            border border-slate-200 dark:border-slate-700
            bg-white dark:bg-[#111827]
            animate-slide-up
          "
        >
          {/* Header */}
          <div className="shrink-0 px-5 py-4 bg-gradient-to-r from-violet-600 to-indigo-600">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-white/20 backdrop-blur flex items-center justify-center text-lg shrink-0">
                  ✦
                </div>
                <div>
                  <h3 className="text-white font-bold text-sm tracking-tight">
                    Message Assistant
                  </h3>
                  <p className="text-violet-200 text-xs">
                    {isIndexed
                      ? `⚡ Searching ${messageCount} messages`
                      : "⏳ Load messages to activate"}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="w-7 h-7 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center text-white/80 text-xs transition-colors"
              >
                ✕
              </button>
            </div>

            {/* Status bar */}
            <div
              className={`mt-3 px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-2
              ${
                isIndexed
                  ? "bg-emerald-500/20 text-emerald-200 border border-emerald-400/20"
                  : "bg-white/10 text-violet-200 border border-white/10"
              }`}
            >
              <span
                className={`w-1.5 h-1.5 rounded-full shrink-0 ${isIndexed ? "bg-emerald-400 animate-pulse" : "bg-violet-300"}`}
              />
              {isIndexed
                ? `AI active · ${messageCount} messages indexed`
                : "Waiting for messages to be loaded"}
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50 dark:bg-[#0f1629]">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
              >
                {msg.role === "assistant" && (
                  <div className="w-7 h-7 rounded-xl bg-gradient-to-br from-violet-600 to-indigo-600 flex items-center justify-center text-white text-xs shrink-0 mr-2 mt-0.5">
                    ✦
                  </div>
                )}

                <div
                  className={`
                  max-w-[82%] rounded-2xl px-4 py-3 text-sm shadow-sm
                  ${
                    msg.role === "user"
                      ? "bg-gradient-to-br from-violet-600 to-indigo-600 text-white rounded-br-sm"
                      : "bg-white dark:bg-[#1e293b] text-slate-800 dark:text-slate-200 rounded-bl-sm border border-slate-100 dark:border-slate-700"
                  }
                `}
                >
                  <p className="whitespace-pre-wrap leading-relaxed">
                    {msg.content}
                  </p>

                  {/* Sources */}
                  {msg.sources && msg.sources.length > 0 && (
                    <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-600 space-y-1.5">
                      <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-400 dark:text-slate-500 mb-2">
                        Sources
                      </p>
                      {msg.sources.map((src, i) => (
                        <div
                          key={i}
                          className={`flex items-center gap-2 px-2.5 py-1.5 rounded-xl text-xs
                          ${PLATFORM_BADGE[src.platform] ?? "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700"}`}
                        >
                          <span>{PLATFORM_ICON[src.platform] ?? "📬"}</span>
                          <span className="font-semibold capitalize">
                            {src.platform}
                          </span>
                          <span className="text-slate-400">·</span>
                          <span className="truncate max-w-[100px]">
                            {src.sender}
                          </span>
                          <span className="ml-auto font-bold shrink-0">
                            {(src.relevance_score * 100).toFixed(0)}%
                          </span>
                        </div>
                      ))}
                    </div>
                  )}

                  <p
                    className={`text-[10px] mt-2 ${msg.role === "user" ? "text-violet-200" : "text-slate-400 dark:text-slate-600"}`}
                  >
                    {msg.timestamp.toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                </div>
              </div>
            ))}

            {/* Typing indicator */}
            {loading && (
              <div className="flex justify-start items-end gap-2">
                <div className="w-7 h-7 rounded-xl bg-gradient-to-br from-violet-600 to-indigo-600 flex items-center justify-center text-white text-xs shrink-0">
                  ✦
                </div>
                <div className="bg-white dark:bg-[#1e293b] rounded-2xl rounded-bl-sm px-4 py-3 border border-slate-100 dark:border-slate-700 shadow-sm">
                  <div className="flex gap-1 items-center">
                    {[0, 1, 2].map((i) => (
                      <div
                        key={i}
                        className="w-2 h-2 bg-violet-400 rounded-full animate-bounce"
                        style={{ animationDelay: `${i * 150}ms` }}
                      />
                    ))}
                  </div>
                </div>
              </div>
            )}
            <div ref={endRef} />
          </div>

          {/* Input area */}
          <div className="shrink-0 p-3 bg-white dark:bg-[#111827] border-t border-slate-100 dark:border-slate-800">
            {/* Suggestions */}
            <div className="flex flex-wrap gap-1.5 mb-2.5">
              {SUGGESTIONS.map((s) => (
                <button
                  key={s}
                  onClick={() => {
                    setInput(s);
                    inputRef.current?.focus();
                  }}
                  disabled={!isIndexed}
                  className="
                    text-[11px] px-2.5 py-1 rounded-lg font-medium transition-all duration-150
                    bg-slate-100 dark:bg-slate-800
                    text-slate-600 dark:text-slate-400
                    border border-slate-200 dark:border-slate-700
                    hover:bg-violet-50 hover:text-violet-700 hover:border-violet-200
                    dark:hover:bg-violet-900/20 dark:hover:text-violet-300 dark:hover:border-violet-700
                    disabled:opacity-30 disabled:cursor-not-allowed
                  "
                >
                  {s}
                </button>
              ))}
            </div>

            {/* Input row */}
            <div className="flex gap-2">
              <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleQuery()}
                disabled={!isIndexed || loading}
                placeholder={
                  isIndexed
                    ? "Ask about your messages…"
                    : "Load messages first…"
                }
                className="input flex-1 py-2 text-sm"
              />
              <button
                onClick={handleQuery}
                disabled={!isIndexed || loading || !input.trim()}
                className="
                  px-4 py-2 rounded-xl text-sm font-semibold text-white
                  bg-gradient-to-r from-violet-600 to-indigo-600
                  hover:from-violet-500 hover:to-indigo-500
                  disabled:opacity-40 disabled:cursor-not-allowed
                  transition-all duration-150 active:scale-95 shadow-sm
                "
              >
                {loading ? (
                  <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin block" />
                ) : (
                  "Send"
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default ChatAssistant;
